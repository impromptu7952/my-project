<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Actions\Media\AttachEpisodeMasterFromPath;
use App\Contracts\VideoGenProvider;
use App\Enums\ArtifactKind;
use App\Models\Episode;
use App\Models\MediaAsset;
use App\Models\ProductionRun;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Drive a short Imagine video from the run package and attach as episode master.
 *
 * @return array{asset: MediaAsset, method: string, prompt: string, meta: array<string, mixed>}
 */
final readonly class GenerateImagineMaster
{
    public function __construct(
        private VideoGenProvider $videoGen,
        private AttachEpisodeMasterFromPath $attach,
    ) {}

    /**
     * @return array{asset: MediaAsset, method: string, prompt: string, meta: array<string, mixed>}
     */
    public function handle(ProductionRun $run, int $durationSeconds = 6): array
    {
        if (! $this->videoGen->isConfigured()) {
            throw new HttpException(
                422,
                'Imagine video requires XAI_API_KEY (API usage billing — not SuperGrok chat). Set it in .env.',
            );
        }

        $run->loadMissing(['productionSpec', 'artifacts']);
        $episodeSlug = $run->productionSpec?->episode_slug;
        if (! filled($episodeSlug)) {
            throw new HttpException(422, 'Link an episode_slug on the production spec first.');
        }

        $episode = Episode::query()->where('slug', $episodeSlug)->first();
        if ($episode === null) {
            throw new HttpException(422, "Episode [{$episodeSlug}] not found.");
        }

        $prompt = $this->buildPrompt($run);
        $result = $this->videoGen->generate($prompt, [
            'duration' => max(3, min(12, $durationSeconds)),
            'resolution' => '480p',
        ]);

        $path = $result['path'] ?? null;
        if (! is_string($path) || $path === '' || ! is_file($path)) {
            $err = (string) ($result['meta']['error'] ?? 'Imagine returned no video file.');
            throw new HttpException(502, $err);
        }

        $vtt = null;
        $vttArtifact = $run->artifacts
            ->where('kind', ArtifactKind::SubtitlesVtt)
            ->sortByDesc('version')
            ->first();
        if (is_array($vttArtifact?->payload)) {
            $candidate = $vttArtifact->payload['vtt'] ?? $vttArtifact->payload['subtitles_vtt'] ?? null;
            if (is_string($candidate) && str_contains($candidate, 'WEBVTT')) {
                $vtt = $candidate;
            }
        }

        try {
            $asset = $this->attach->handle(
                $episode,
                $path,
                [
                    'source' => 'imagine_video',
                    'method' => 'xai_imagine',
                    'run_id' => $run->id,
                    'prompt' => mb_substr($prompt, 0, 500),
                    'imagine' => $result['meta'] ?? [],
                ],
                $vtt,
            );
        } finally {
            @unlink($path);
        }

        $meta = $run->meta ?? [];
        $meta['last_master_drive'] = [
            'method' => 'imagine_video',
            'at' => now()->toIso8601String(),
            'media_asset_id' => $asset->id,
            'prompt_preview' => mb_substr($prompt, 0, 200),
        ];
        $run->update(['meta' => $meta]);

        return [
            'asset' => $asset,
            'method' => 'imagine_video',
            'prompt' => $prompt,
            'meta' => $result['meta'] ?? [],
        ];
    }

    private function buildPrompt(ProductionRun $run): string
    {
        $brand = config('brand.character', []);
        $name = is_array($brand) ? (string) ($brand['name'] ?? 'Lumi') : 'Lumi';
        $look = is_array($brand['look'] ?? null) ? $brand['look'] : [];
        $style = (string) ($look['style'] ?? 'soft stylized toddler animation, rounded shapes, bright safe colors');

        $script = $run->artifacts
            ->where('kind', ArtifactKind::Script)
            ->sortByDesc('version')
            ->first();
        $visual = $run->artifacts
            ->where('kind', ArtifactKind::ImagePrompts)
            ->sortByDesc('version')
            ->first();
        $videoPrompts = $run->artifacts
            ->where('kind', ArtifactKind::VideoPrompts)
            ->sortByDesc('version')
            ->first();

        $lines = [];
        if (is_array($script?->payload)) {
            $title = (string) ($script->payload['title'] ?? '');
            if ($title !== '') {
                $lines[] = "Episode title: {$title}";
            }
            $sections = $script->payload['sections'] ?? [];
            if (is_array($sections)) {
                foreach (array_slice($sections, 0, 4) as $section) {
                    if (! is_array($section)) {
                        continue;
                    }
                    foreach (array_slice($section['dialogue'] ?? [], 0, 3) as $line) {
                        if (is_string($line) && trim($line) !== '') {
                            $lines[] = 'Dialogue: '.trim($line);
                        }
                    }
                }
            }
        }

        $shot = null;
        if (is_array($videoPrompts?->payload)) {
            $list = $videoPrompts->payload['video_prompts'] ?? [];
            if (is_array($list) && isset($list[0]['prompt']) && is_string($list[0]['prompt'])) {
                $shot = $list[0]['prompt'];
            }
        }
        if ($shot === null && is_array($visual?->payload)) {
            $list = $visual->payload['image_prompts'] ?? $visual->payload['prompts'] ?? [];
            if (is_array($list) && isset($list[0]['prompt']) && is_string($list[0]['prompt'])) {
                $shot = $list[0]['prompt'];
            }
        }

        $specTitle = (string) ($run->productionSpec?->title ?? 'toddler learning moment');

        return implode("\n", array_filter([
            "Warm educational short for ages 1–3 starring animated character {$name}.",
            "Style: {$style}. Soft lighting, friendly, no scary elements, no text-heavy frames.",
            "Topic: {$specTitle}.",
            $shot ? "Primary visual action: {$shot}" : null,
            $lines !== [] ? implode(' ', array_slice($lines, 0, 6)) : null,
            'Gentle camera, smiling character, bright classroom/playroom, Albanian early childhood energy, cinematic but simple.',
        ]));
    }
}
