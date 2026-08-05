<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\EpisodeStatus;
use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Enums\ProductionRunStatus;
use App\Models\Episode;
use App\Models\MediaAsset;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class PublishEpisode
{
    public function handle(Episode $episode, ?ProductionRun $run = null, ?User $editor = null): Episode
    {
        return DB::transaction(function () use ($episode, $run, $editor): Episode {
            /** @var Episode $episode */
            $episode = Episode::query()->lockForUpdate()->findOrFail($episode->id);
            $episode->load('mediaAssets');

            if ($run !== null) {
                /** @var ProductionRun $run */
                $run = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);
                $run->loadMissing('productionSpec');

                if ($run->status !== ProductionRunStatus::Approved) {
                    throw new HttpException(422, 'Production run must be approved before publish.');
                }

                $spec = $run->productionSpec;
                if ($spec !== null) {
                    $matchesSlug = filled($spec->episode_slug) && $spec->episode_slug === $episode->slug;
                    $matchesId = $spec->episode_id !== null && (int) $spec->episode_id === (int) $episode->id;

                    if (! $matchesSlug && ! $matchesId) {
                        throw new HttpException(422, 'Episode does not match this production run’s spec.');
                    }
                }
            }

            /** @var MediaAsset|null $master */
            $master = $episode->mediaAssets->first(
                fn (MediaAsset $asset): bool => $asset->kind === MediaKind::VideoMaster
                    && $asset->provider === MediaProvider::Self
                    && filled($asset->path)
            );

            if ($master === null) {
                throw new HttpException(422, 'Self-hosted video_master media asset is required to publish.');
            }

            $disk = $master->disk ?? (string) config('media.self.disk', 'local');
            if (! Storage::disk($disk)->exists((string) $master->path)) {
                throw new HttpException(422, 'video_master file is missing from storage.');
            }

            $episode->update([
                'status' => EpisodeStatus::Published,
                'published_at' => $episode->published_at ?? now(),
            ]);

            if ($run !== null) {
                $run->update([
                    'status' => ProductionRunStatus::Published,
                    'completed_at' => $run->completed_at ?? now(),
                    'meta' => array_merge($run->meta ?? [], [
                        'published_by' => $editor?->id,
                        'published_at' => now()->toIso8601String(),
                        'episode_id' => $episode->id,
                    ]),
                ]);
            }

            return $episode->fresh() ?? $episode;
        });
    }
}
