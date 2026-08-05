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

        $episodes = $topic->series
            ->flatMap(fn ($series) => $series->episodes)
            ->map(fn ($episode) => [
                'slug' => $episode->slug,
                'title' => $episode->localizedTitle($locale),
                'summary' => $episode->localizedSummary($locale),
                'href' => route('videos.show', $episode),
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
            'episodes' => $episodes,
        ]);
    }
}
