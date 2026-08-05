<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Actions\Parent\ToggleFavorite;
use App\Http\Controllers\Controller;
use App\Models\Episode;
use App\Models\Game;
use App\Models\ParentFavorite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class FavoriteController extends Controller
{
    public function index(Request $request): Response
    {
        $locale = app()->getLocale();
        $favorites = ParentFavorite::query()
            ->where('user_id', $request->user()->id)
            ->with(['episode.series.topic', 'game'])
            ->latest()
            ->get()
            ->map(function (ParentFavorite $fav) use ($locale): array {
                if ($fav->episode) {
                    return [
                        'type' => 'episode',
                        'title' => $fav->episode->localizedTitle($locale),
                        'href' => route('videos.show', $fav->episode),
                    ];
                }

                return [
                    'type' => 'game',
                    'title' => $fav->game?->localizedName($locale),
                    'href' => $fav->game ? route($fav->game->route_name) : '/',
                ];
            });

        return Inertia::render('parent/favorites', [
            'favorites' => $favorites,
        ]);
    }

    public function store(Request $request, ToggleFavorite $toggle): RedirectResponse
    {
        $data = $request->validate([
            'episode_id' => ['nullable', 'exists:episodes,id'],
            'game_id' => ['nullable', 'exists:games,id'],
        ]);

        $episode = isset($data['episode_id']) ? Episode::query()->find($data['episode_id']) : null;
        $game = isset($data['game_id']) ? Game::query()->find($data['game_id']) : null;

        $toggle->handle($request->user(), $episode, $game);

        return back();
    }
}
