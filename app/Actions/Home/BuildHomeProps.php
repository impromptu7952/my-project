<?php

declare(strict_types=1);

namespace App\Actions\Home;

use App\Models\Episode;
use App\Models\Game;
use Illuminate\Support\Facades\Route;

final readonly class BuildHomeProps
{
    /**
     * @return array<string, mixed>
     */
    public function handle(string $locale = 'sq'): array
    {
        $toddlerGames = Game::query()
            ->active()
            ->toddlerFeatured()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Game $game): array => $this->gameCard($game, $locale))
            ->values()
            ->all();

        $moreGames = Game::query()
            ->active()
            ->where('featured_for_toddlers', false)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Game $game): array => $this->gameCard($game, $locale))
            ->values()
            ->all();

        $featuredEpisodes = [];

        if (config('features.videos')) {
            $featuredEpisodes = Episode::query()
                ->published()
                ->with(['series.topic', 'mediaAssets'])
                ->orderBy('sort_order')
                ->limit(6)
                ->get()
                ->map(fn (Episode $episode): array => $this->episodeCard($episode, $locale))
                ->values()
                ->all();
        }

        return [
            'featuredEpisodes' => $featuredEpisodes,
            'toddlerGames' => $toddlerGames,
            'moreGames' => $moreGames,
            'locale' => $locale,
            'features' => [
                'videos' => (bool) config('features.videos'),
                'studio' => (bool) config('features.studio'),
                'toddlerHome' => (bool) config('features.toddler_home'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function gameCard(Game $game, string $locale): array
    {
        $href = Route::has($game->route_name)
            ? route($game->route_name)
            : '/';

        return [
            'slug' => $game->slug,
            'name' => $game->localizedName($locale),
            'description' => $game->localizedDescription($locale),
            'href' => $href,
            'routeName' => $game->route_name,
            'emoji' => $game->emoji,
            'badge' => $game->localizedBadge($locale),
            'ageBand' => $game->age_band?->value ?? '3-5',
            'gradient' => $game->gradient ?? 'from-sky-400 to-blue-600',
            'featuredForToddlers' => $game->featured_for_toddlers,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function episodeCard(Episode $episode, string $locale): array
    {
        return [
            'slug' => $episode->slug,
            'title' => $episode->localizedTitle($locale),
            'summary' => $episode->localizedSummary($locale),
            'durationSeconds' => $episode->duration_seconds,
            'ageBand' => $episode->age_band?->value ?? '1-3',
            'topicName' => $episode->series?->topic?->localizedName($locale),
            'href' => route('videos.show', $episode),
            'emoji' => match ($episode->series?->topic?->slug) {
                'ngjyrat' => '🌈',
                'kafshet' => '🐶',
                'pjeset-e-trupit' => '🖐️',
                'pershendetjet' => '👋',
                'fjalet-e-para' => '💬',
                default => '🎬',
            },
        ];
    }
}
