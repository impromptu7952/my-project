<?php

declare(strict_types=1);

namespace App\Actions\Parent;

use App\Enums\EpisodeStatus;
use App\Models\Episode;
use App\Models\User;
use App\Models\WatchProgress;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class UpdateWatchProgress
{
    public function handle(User $user, Episode $episode, int $positionSeconds, ?int $durationSeconds = null): WatchProgress
    {
        if ($episode->status !== EpisodeStatus::Published) {
            throw new HttpException(422, 'Progress can only be tracked for published episodes.');
        }

        $duration = $durationSeconds ?? $episode->duration_seconds;
        $completed = $duration !== null && $duration > 0 && $positionSeconds >= (int) ($duration * 0.9);

        return WatchProgress::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'episode_id' => $episode->id,
            ],
            [
                'position_seconds' => max(0, $positionSeconds),
                'duration_seconds' => $duration,
                'completed' => $completed,
                'last_watched_at' => now(),
            ]
        );
    }
}
