<?php

declare(strict_types=1);

namespace App\Actions\Parent;

use App\Models\Episode;
use App\Models\Game;
use App\Models\ParentFavorite;
use App\Models\User;

final readonly class ToggleFavorite
{
    public function handle(User $user, ?Episode $episode = null, ?Game $game = null): bool
    {
        if ($episode === null && $game === null) {
            return false;
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
