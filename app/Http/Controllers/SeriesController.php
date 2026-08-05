<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Series;
use Inertia\Inertia;
use Inertia\Response;

final class SeriesController extends Controller
{
    public function show(Series $series): Response
    {
        $locale = app()->getLocale();
        $series->load([
            'topic',
            'episodes' => fn ($q) => $q->published()->orderBy('sort_order'),
        ]);

        $episodes = $series->episodes
            ->map(fn ($episode) => [
                'slug' => $episode->slug,
                'title' => $episode->localizedTitle($locale),
                'summary' => $episode->localizedSummary($locale),
                'href' => route('videos.show', $episode),
                'durationSeconds' => $episode->duration_seconds,
                'ageBand' => $episode->age_band?->value ?? $episode->age_band,
                'episodeNumber' => $episode->episode_number,
            ])
            ->values();

        return Inertia::render('series/show', [
            'series' => [
                'slug' => $series->slug,
                'title' => $series->localizedTitle($locale),
            ],
            'topic' => $series->topic ? [
                'slug' => $series->topic->slug,
                'name' => $series->topic->localizedName($locale),
                'href' => route('topics.show', $series->topic),
            ] : null,
            'episodes' => $episodes,
        ]);
    }
}
