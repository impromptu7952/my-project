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
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class PublishEpisode
{
    public function handle(Episode $episode, ?ProductionRun $run = null, ?User $editor = null): Episode
    {
        return DB::transaction(function () use ($episode, $run, $editor): Episode {
            $episode->load('mediaAssets');

            $hasMaster = $episode->mediaAssets->contains(
                fn (MediaAsset $asset): bool => $asset->kind === MediaKind::VideoMaster
                    && $asset->provider === MediaProvider::Self
                    && filled($asset->path)
            );

            if (! $hasMaster) {
                throw new HttpException(422, 'Self-hosted video_master media asset is required to publish.');
            }

            $episode->update([
                'status' => EpisodeStatus::Published,
                'published_at' => $episode->published_at ?? now(),
            ]);

            if ($run !== null) {
                if (! in_array($run->status, [ProductionRunStatus::Approved, ProductionRunStatus::Published], true)) {
                    throw new HttpException(422, 'Production run must be approved before publish.');
                }

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
