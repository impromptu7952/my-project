<?php

declare(strict_types=1);

namespace App\Actions\Episodes;

use App\Actions\Media\ResolveEpisodePlayback;
use App\Enums\EpisodeStatus;
use App\Models\CurriculumLink;
use App\Models\Episode;
use App\Models\Game;
use Illuminate\Support\Facades\Route;

final readonly class ShowPublishedEpisode
{
    public function __construct(
        private ResolveEpisodePlayback $resolvePlayback,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function handle(Episode $episode, string $locale = 'sq'): array
    {
        abort_unless($episode->status === EpisodeStatus::Published, 404);

        $episode->load(['series.topic', 'mediaAssets', 'curriculumLinks.game']);

        $playback = $this->resolvePlayback->handle($episode);

        $linkedGames = $this->resolveLinkedGames($episode, $locale);

        $nextEpisode = Episode::query()
            ->published()
            ->where('series_id', $episode->series_id)
            ->where('sort_order', '>', $episode->sort_order)
            ->orderBy('sort_order')
            ->first();

        return [
            'episode' => [
                'id' => $episode->id,
                'slug' => $episode->slug,
                'title' => $episode->localizedTitle($locale),
                'summary' => $episode->localizedSummary($locale),
                'durationSeconds' => $episode->duration_seconds,
                'ageBand' => $episode->age_band?->value ?? '1-3',
                'topicName' => $episode->series?->topic?->localizedName($locale),
                'topicSlug' => $episode->series?->topic?->slug,
                'topicHref' => $episode->series?->topic
                    ? route('topics.show', $episode->series->topic)
                    : null,
                'seriesTitle' => $episode->series?->localizedTitle($locale),
                'seriesHref' => $episode->series
                    ? route('series.show', $episode->series)
                    : null,
            ],
            'playback' => $playback,
            'linkedGames' => $linkedGames,
            'coPlayTips' => $this->coPlayTips($locale),
            'nextEpisode' => $nextEpisode ? [
                'slug' => $nextEpisode->slug,
                'title' => $nextEpisode->localizedTitle($locale),
                'href' => route('videos.show', $nextEpisode),
            ] : null,
        ];
    }

    /**
     * @return list<string>
     */
    private function coPlayTips(string $locale): array
    {
        if ($locale === 'en') {
            return [
                'Sit together and name what you see out loud.',
                'Pause after questions — wait 3–5 seconds for a response.',
                'Clap, point, and wave along with Lumi.',
                'Keep sessions short; stop while it is still fun.',
            ];
        }

        return [
            'Uluni bashkë dhe emërtoni me zë atë që shihni.',
            'Bëni pauzë pas pyetjeve — prisni 3–5 sekonda për përgjigje.',
            'Duartrokisni, tregoni me gisht dhe përshëndetni me Lumin.',
            'Mbajini seancat të shkurtra; ndaloni kur ende është argëtuese.',
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function resolveLinkedGames(Episode $episode, string $locale): array
    {
        $links = $episode->curriculumLinks->loadMissing('game');

        if ($links->isEmpty() && $episode->series?->topic_id) {
            $links = CurriculumLink::query()
                ->where('topic_id', $episode->series->topic_id)
                ->whereNull('episode_id')
                ->with('game')
                ->orderBy('sort_order')
                ->get();
        }

        return $links
            ->map(function (CurriculumLink $link) use ($locale): ?array {
                $game = $link->game;
                if (! $game instanceof Game || ! $game->is_active) {
                    return null;
                }

                return [
                    'slug' => $game->slug,
                    'name' => $game->localizedName($locale),
                    'emoji' => $game->emoji,
                    'href' => Route::has($game->route_name) ? route($game->route_name) : '/',
                    'ageBand' => $game->age_band?->value,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }
}
