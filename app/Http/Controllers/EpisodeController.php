<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Episodes\ShowPublishedEpisode;
use App\Models\Episode;
use Inertia\Inertia;
use Inertia\Response;

final class EpisodeController extends Controller
{
    public function index(): Response
    {
        abort_unless(config('features.videos'), 404);

        $locale = app()->getLocale();

        $episodes = Episode::query()
            ->published()
            ->with(['series.topic', 'mediaAssets'])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Episode $episode): array => [
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
                    'pershendetjet' => '👋',
                    'pjeset-e-trupit' => '🖐️',
                    'fjalet-e-para' => '💬',
                    default => '🎬',
                },
            ]);

        return Inertia::render('videos/index', [
            'episodes' => $episodes,
            'locale' => $locale,
        ]);
    }

    public function show(Episode $episode, ShowPublishedEpisode $action): Response
    {
        abort_unless(config('features.videos'), 404);

        return Inertia::render('videos/show', $action->handle($episode, app()->getLocale()));
    }
}
