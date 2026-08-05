<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ArtifactKind;
use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Enums\ProductionRunStatus;
use App\Models\Episode;
use App\Models\MediaAsset;
use App\Models\ProductionRun;

/**
 * @return list<array{id: string, label: string, done: bool, detail: string|null}>
 */
final readonly class BuildPublishChecklist
{
    /**
     * @return list<array{id: string, label: string, done: bool, detail: string|null}>
     */
    public function handle(ProductionRun $run): array
    {
        $run->loadMissing(['artifacts', 'productionSpec']);

        $has = function (string $kind) use ($run): bool {
            return $run->artifacts->contains(
                fn ($a): bool => $a->kind->value === $kind
            );
        };

        $episodeSlug = $run->productionSpec?->episode_slug;
        $episode = filled($episodeSlug)
            ? Episode::query()->where('slug', $episodeSlug)->with('mediaAssets')->first()
            : null;

        $hasMaster = false;
        $hasSubs = false;

        if ($episode !== null) {
            $hasMaster = $episode->mediaAssets->contains(
                fn (MediaAsset $m): bool => $m->kind === MediaKind::VideoMaster
                    && $m->provider === MediaProvider::Self
                    && filled($m->path)
            );
            $hasSubs = $episode->mediaAssets->contains(
                fn (MediaAsset $m): bool => $m->kind === MediaKind::Subtitle
            );
        }

        $quality = $run->artifacts
            ->where('kind', ArtifactKind::QualityReport)
            ->sortByDesc('version')
            ->first();
        $qualityPassed = false;
        if ($quality !== null && is_array($quality->payload)) {
            $qualityPassed = (bool) ($quality->payload['passed']
                ?? $quality->payload['deterministic']['passed']
                ?? false);
        }

        $packageVtt = $has(ArtifactKind::SubtitlesVtt->value);

        return [
            [
                'id' => 'script',
                'label' => 'Script package exists',
                'done' => $has(ArtifactKind::Script->value),
                'detail' => 'Generate or edit the script stage',
            ],
            [
                'id' => 'voice',
                'label' => 'Voice package exists',
                'done' => $has(ArtifactKind::VoScript->value),
                'detail' => 'VO script / TTS manifest',
            ],
            [
                'id' => 'visuals',
                'label' => 'Visual prompts exist',
                'done' => $has(ArtifactKind::ImagePrompts->value) || $has(ArtifactKind::VideoPrompts->value),
                'detail' => 'Image or video prompts for animation',
            ],
            [
                'id' => 'edit',
                'label' => 'Edit / captions package',
                'done' => $has(ArtifactKind::EditInstructions->value) || $packageVtt,
                'detail' => 'Edit instructions or VTT captions',
            ],
            [
                'id' => 'quality',
                'label' => 'Quality checks passed',
                'done' => $qualityPassed,
                'detail' => $quality ? 'See quality report artifact' : 'Run quality stage',
            ],
            [
                'id' => 'approved',
                'label' => 'Run fully approved',
                'done' => in_array($run->status, [
                    ProductionRunStatus::Approved,
                    ProductionRunStatus::Published,
                ], true),
                'detail' => 'Pass script + final human gates',
            ],
            [
                'id' => 'master',
                'label' => 'Video master uploaded',
                'done' => $hasMaster,
                'detail' => $episodeSlug
                    ? "Episode {$episodeSlug} needs a self-hosted MP4"
                    : 'Link an episode_slug on the spec first',
            ],
            [
                'id' => 'captions',
                'label' => 'Captions available',
                'done' => $hasSubs || $packageVtt,
                'detail' => 'Episode VTT media or package subtitles_vtt (auto-attached on publish)',
            ],
        ];
    }
}
