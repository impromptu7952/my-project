<?php

declare(strict_types=1);

namespace App\Services\Production;

use App\Ai\Agents\ProductionStageAgent;
use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Models\AgentProfile;
use App\Models\ProductionRun;
use App\Services\Xai\XaiClient;
use Illuminate\Support\Str;
use Laravel\Ai\Enums\Lab;
use RuntimeException;
use Throwable;

/**
 * Builds stage artifacts via Grok using the Laravel AI SDK (Lab::xAI).
 */
final class StageAgentService
{
    public function __construct(private XaiClient $xai) {}

    /**
     * @return array{payload: array<string, mixed>, meta: array<string, mixed>}
     */
    public function generate(ProductionRun $run, ProductionStage $stage, ArtifactKind $kind): array
    {
        if (! $this->xai->isConfigured()) {
            throw new RuntimeException('XAI_API_KEY is not configured.');
        }

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

        $model = $this->resolveModel($run, $profile);
        $maxTokens = $profile?->max_tokens
            ?? (int) config('services.xai.max_tokens.'.$stage->value, 3000);
        $temperature = $profile?->temperature;

        $agent = new ProductionStageAgent(
            systemInstructions: $systemContent,
            maxTokens: $maxTokens,
            temperature: $temperature,
        );

        $response = $agent->prompt(
            $userPrompt,
            provider: Lab::xAI,
            model: $model,
            timeout: 180,
        );

        $payload = $this->decodeJsonObject($response->text);
        $usage = $response->usage->toArray();

        return [
            'payload' => $payload,
            'meta' => [
                'agent' => 'laravel_ai',
                'provider' => Lab::xAI->value,
                'model' => $model,
                'agent_profile_id' => $profile?->id,
                'agent_profile_slug' => $profile?->slug,
                'usage' => $usage,
                'kind' => $kind->value,
            ],
        ];
    }

    private function resolveModel(ProductionRun $run, ?AgentProfile $profile): string
    {
        $runOverride = $run->meta['text_model'] ?? null;
        if (is_string($runOverride) && $runOverride !== '') {
            return $runOverride;
        }

        if (filled($profile?->model)) {
            return (string) $profile->model;
        }

        return (string) config('services.xai.model', config('ai.providers.xai.models.text.default', 'grok-4.5'));
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
