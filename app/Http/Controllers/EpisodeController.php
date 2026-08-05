<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Episodes\ShowPublishedEpisode;
use App\Models\Episode;
use App\Models\Topic;
use Inertia\Inertia;
use Inertia\Response;

final class EpisodeController extends Controller
{
    public function index(): Response
    {
        abort_unless(config('features.videos'), 404);

        $locale = app()->getLocale();
        $topicSlug = request()->string('topic')->toString() ?: null;

        $query = Episode::query()
            ->published()
            ->with(['series.topic', 'mediaAssets'])
            ->orderBy('sort_order');

        if (filled($topicSlug)) {
            $query->whereHas('series.topic', fn ($q) => $q->where('slug', $topicSlug));
        }

        $episodes = $query->get()->map(fn (Episode $episode): array => [
            'slug' => $episode->slug,
            'title' => $episode->localizedTitle($locale),
            'summary' => $episode->localizedSummary($locale),
            'durationSeconds' => $episode->duration_seconds,
            'ageBand' => $episode->age_band?->value ?? '1-3',
            'topicName' => $episode->series?->topic?->localizedName($locale),
            'topicSlug' => $episode->series?->topic?->slug,
            'seriesSlug' => $episode->series?->slug,
            'seriesHref' => $episode->series
                ? route('series.show', $episode->series)
                : null,
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

        $topics = Topic::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Topic $topic): array => [
                'slug' => $topic->slug,
                'name' => $topic->localizedName($locale),
                'href' => route('videos.index', ['topic' => $topic->slug]),
                'topicPageHref' => route('topics.show', $topic),
            ]);

        return Inertia::render('videos/index', [
            'episodes' => $episodes,
            'topics' => $topics,
            'activeTopic' => $topicSlug,
            'locale' => $locale,
        ]);
    }

    public function show(Episode $episode, ShowPublishedEpisode $action): Response
    {
        abort_unless(config('features.videos'), 404);

        return Inertia::render('videos/show', $action->handle($episode, app()->getLocale()));
    }
}
