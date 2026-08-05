<?php

declare(strict_types=1);

namespace App\Actions\Parent;

use App\Enums\EpisodeStatus;
use App\Models\Episode;
use App\Models\Game;
use App\Models\ParentFavorite;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class ToggleFavorite
{
    public function handle(User $user, ?Episode $episode = null, ?Game $game = null): bool
    {
        if ($episode === null && $game === null) {
            return false;
        }

        if ($episode !== null && $episode->status !== EpisodeStatus::Published) {
            throw new HttpException(422, 'Only published episodes can be favorited.');
        }

        if ($game !== null && ! $game->is_active) {
            throw new HttpException(422, 'Only active games can be favorited.');
        }

        $query = ParentFavorite::query()->where('user_id', $user->id);

        if ($episode !== null) {
            $query->where('episode_id', $episode->id);
        }

        if ($game !== null) {
            $query->where('game_id', $game->id);
        }

        $existing = $query->first();

        if ($existing !== null) {
            $existing->delete();

            return false;
        }

        ParentFavorite::query()->create([
            'user_id' => $user->id,
            'episode_id' => $episode?->id,
            'game_id' => $game?->id,
        ]);

        return true;
    }
}
