<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Enums\EpisodeStatus;
use App\Http\Controllers\Controller;
use App\Models\Episode;
use App\Models\ProductionSpec;
use Inertia\Inertia;
use Inertia\Response;

final class EpisodeStudioController extends Controller
{
    public function index(): Response
    {
        $locale = app()->getLocale();

        $episodes = Episode::query()
            ->with(['series.topic', 'mediaAssets'])
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get()
            ->map(function (Episode $episode) use ($locale): array {
                $hasMaster = $episode->mediaAssets->contains(
                    fn ($m) => $m->kind->value === 'video_master'
                );

                return [
                    'id' => $episode->id,
                    'slug' => $episode->slug,
                    'title' => $episode->localizedTitle($locale),
                    'status' => $episode->status->value,
                    'topicName' => $episode->series?->topic?->localizedName($locale),
                    'hasVideoMaster' => $hasMaster,
                    'durationSeconds' => $episode->duration_seconds,
                    'updatedAt' => $episode->updated_at?->toIso8601String(),
                    'publicHref' => $episode->status === EpisodeStatus::Published
                        ? route('videos.show', $episode)
                        : null,
                ];
            });

        $specs = ProductionSpec::query()
            ->latest()
            ->limit(50)
            ->get(['id', 'slug', 'title', 'episode_slug']);

        return Inertia::render('studio/episodes/index', [
            'episodes' => $episodes,
            'specs' => $specs->map(fn (ProductionSpec $s) => [
                'slug' => $s->slug,
                'title' => $s->title,
                'episodeSlug' => $s->episode_slug,
            ]),
        ]);
    }

    public function show(Episode $episode): Response
    {
        $locale = app()->getLocale();
        $episode->load(['series.topic', 'mediaAssets']);

        $specs = ProductionSpec::query()
            ->where('episode_slug', $episode->slug)
            ->withCount('runs')
            ->latest()
            ->get();

        return Inertia::render('studio/episodes/show', [
            'episode' => [
                'id' => $episode->id,
                'slug' => $episode->slug,
                'title' => $episode->localizedTitle($locale),
                'titleSq' => $episode->title_sq,
                'titleEn' => $episode->title_en,
                'summarySq' => $episode->summary_sq,
                'summaryEn' => $episode->summary_en,
                'status' => $episode->status->value,
                'durationSeconds' => $episode->duration_seconds,
                'ageBand' => $episode->age_band?->value,
                'topicName' => $episode->series?->topic?->localizedName($locale),
                'publicHref' => $episode->status === EpisodeStatus::Published
                    ? route('videos.show', $episode)
                    : null,
            ],
            'media' => $episode->mediaAssets->map(fn ($m) => [
                'id' => $m->id,
                'kind' => $m->kind->value,
                'mimeType' => $m->mime_type,
                'sizeBytes' => $m->size_bytes,
                'url' => $m->studioUrl(),
            ]),
            'specs' => $specs->map(fn (ProductionSpec $s) => [
                'slug' => $s->slug,
                'title' => $s->title,
                'runsCount' => $s->runs_count,
                'href' => route('studio.specs.show', $s),
            ]),
        ]);
    }
}
