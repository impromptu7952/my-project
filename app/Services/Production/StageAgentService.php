<?php

declare(strict_types=1);

namespace App\Services\Production;

use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Models\AgentProfile;
use App\Models\ProductionRun;
use App\Services\Xai\XaiClient;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Builds stage artifacts via Grok (xAI) using per-stage agent profiles.
 */
final class StageAgentService
{
    public function __construct(private XaiClient $xai) {}

    /**
     * @return array{payload: array<string, mixed>, meta: array<string, mixed>}
     */
    public function generate(ProductionRun $run, ProductionStage $stage, ArtifactKind $kind): array
    {
        $profile = $this->resolveProfile($run, $stage);
        $spec = $run->productionSpec?->spec ?? [];
        $prior = $this->priorContext($run, $stage);
        $brand = config('brand.character', []);
        $stageNotes = $this->stageNotesFor($run, $stage);

        $systemBase = $profile?->system_prompt
            ?? 'You are a production agent for toddler educational video. Reply with valid JSON only.';

        $brandBlock = $this->formatBrandBlock(is_array($brand) ? $brand : []);
        $systemContent = $brandBlock !== ''
            ? $systemBase."\n\n".$brandBlock
            : $systemBase;

        $userPrompt = json_encode([
            'task' => "Generate artifact kind={$kind->value} for stage={$stage->value}",
            'character_bible' => is_array($brand) ? $brand : [],
            'production_spec' => $spec,
            'editor_stage_notes' => $stageNotes,
            'prior_artifacts' => $prior,
            'instructions' => 'Return a single JSON object only. No markdown fences. Stay true to the character bible (Lumi), short Albanian sentences, ages 1–3.',
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        if ($userPrompt === false) {
            throw new RuntimeException('Failed to encode agent prompt.');
        }

        $result = $this->xai->chat(
            messages: [
                [
                    'role' => 'system',
                    'content' => $systemContent,
                ],
                [
                    'role' => 'user',
                    'content' => $userPrompt,
                ],
            ],
            maxTokens: $profile?->max_tokens
                ?? (int) config('services.xai.max_tokens.'.$stage->value, 3000),
            model: $profile?->model,
            temperature: $profile?->temperature,
        );

        $payload = $this->decodeJsonObject($result['content']);

        return [
            'payload' => $payload,
            'meta' => [
                'agent' => 'xai',
                'model' => $profile?->model ?? config('services.xai.model'),
                'agent_profile_id' => $profile?->id,
                'agent_profile_slug' => $profile?->slug,
                'usage' => $result['usage'],
                'kind' => $kind->value,
            ],
        ];
    }

    private function resolveProfile(ProductionRun $run, ProductionStage $stage): ?AgentProfile
    {
        $overrideId = $run->agentProfileIdFor($stage);

        if ($overrideId !== null) {
            $profile = AgentProfile::query()->active()->find($overrideId);
            if ($profile !== null) {
                return $profile;
            }
        }

        return AgentProfile::defaultFor($stage);
    }

    /**
     * @return array<string, mixed>
     */
    private function priorContext(ProductionRun $run, ProductionStage $stage): array
    {
        $order = [
            ProductionStage::Curriculum->value => [ArtifactKind::Curriculum->value],
            ProductionStage::Script->value => [ArtifactKind::Script->value],
            ProductionStage::Storyboard->value => [ArtifactKind::Storyboard->value, ArtifactKind::ShotList->value],
            ProductionStage::VisualPrompts->value => [ArtifactKind::ImagePrompts->value, ArtifactKind::VideoPrompts->value],
            ProductionStage::Voice->value => [ArtifactKind::VoScript->value, ArtifactKind::TtsManifest->value],
            ProductionStage::Editor->value => [ArtifactKind::EditInstructions->value, ArtifactKind::SubtitlesVtt->value],
        ];

        $include = [];
        foreach ($order as $stageKey => $kinds) {
            if ($stageKey === $stage->value) {
                break;
            }
            foreach ($kinds as $kind) {
                $artifact = $run->latestArtifact($kind);
                if ($artifact !== null) {
                    $include[$kind] = $artifact->payload;
                }
            }
        }

        return $include;
    }

    /**
     * @param  array<string, mixed>  $brand
     */
    private function formatBrandBlock(array $brand): string
    {
        if ($brand === []) {
            return '';
        }

        $name = (string) ($brand['name'] ?? 'Lumi');
        $lines = [
            "Character bible ({$name}):",
            'Role: '.(string) ($brand['role'] ?? 'toddler educator'),
            'Language: '.(string) ($brand['language'] ?? 'sq').' / '.(string) ($brand['dialect'] ?? 'standard_literary_albanian'),
            'Age target: '.(string) ($brand['age_target'] ?? '1-3'),
        ];

        if (is_array($brand['do'] ?? null)) {
            $lines[] = 'Do: '.implode('; ', array_map('strval', $brand['do']));
        }
        if (is_array($brand['dont'] ?? null)) {
            $lines[] = "Don't: ".implode('; ', array_map('strval', $brand['dont']));
        }
        if (is_array($brand['sample_lines'] ?? null)) {
            $lines[] = 'Sample lines: '.implode(' | ', array_map('strval', $brand['sample_lines']));
        }

        return implode("\n", $lines);
    }

    private function stageNotesFor(ProductionRun $run, ProductionStage $stage): ?string
    {
        $meta = $run->meta ?? [];
        $notes = $meta['stage_notes'][$stage->value]['notes'] ?? null;

        return is_string($notes) && $notes !== '' ? $notes : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJsonObject(string $content): array
    {
        $trimmed = mb_trim($content);
        $trimmed = Str::of($trimmed)
            ->replaceMatches('/^```(?:json)?\s*/i', '')
            ->replaceMatches('/\s*```$/', '')
            ->toString();

        try {
            /** @var mixed $decoded */
            $decoded = json_decode($trimmed, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            // Last resort: extract first {...} block
            if (preg_match('/\{.*\}/s', $trimmed, $matches) === 1) {
                try {
                    /** @var mixed $decoded */
                    $decoded = json_decode($matches[0], true, 512, JSON_THROW_ON_ERROR);
                } catch (Throwable $e) {
                    throw new RuntimeException('Agent returned non-JSON content: '.$e->getMessage(), previous: $e);
                }
            } else {
                throw new RuntimeException('Agent returned non-JSON content.');
            }
        }

        if (! is_array($decoded)) {
            throw new RuntimeException('Agent JSON root must be an object.');
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }
}
