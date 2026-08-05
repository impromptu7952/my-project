<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Topic;
use Inertia\Inertia;
use Inertia\Response;

final class TopicController extends Controller
{
    public function show(Topic $topic): Response
    {
        $locale = app()->getLocale();
        $topic->load(['series.episodes' => fn ($q) => $q->published()->orderBy('sort_order')]);

        $series = $topic->series
            ->map(fn ($s) => [
                'slug' => $s->slug,
                'title' => $s->localizedTitle($locale),
                'href' => route('series.show', $s),
                'episodeCount' => $s->episodes->count(),
            ])
            ->values();

        $episodes = $topic->series
            ->flatMap(fn ($s) => $s->episodes)
            ->unique('id')
            ->map(fn ($episode) => [
                'slug' => $episode->slug,
                'title' => $episode->localizedTitle($locale),
                'summary' => $episode->localizedSummary($locale),
                'href' => route('videos.show', $episode),
                'durationSeconds' => $episode->duration_seconds,
                'ageBand' => $episode->age_band?->value ?? $episode->age_band,
            ])
            ->values();

        return Inertia::render('topics/show', [
            'topic' => [
                'slug' => $topic->slug,
                'name' => $topic->localizedName($locale),
                'description' => $locale === 'en' && $topic->description_en
                    ? $topic->description_en
                    : $topic->description_sq,
            ],
            'series' => $series,
            'episodes' => $episodes,
        ]);
    }
}
