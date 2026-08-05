<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Enums\EpisodeStatus;
use App\Enums\ProductionRunStatus;
use App\Http\Controllers\Controller;
use App\Models\AgentProfile;
use App\Models\Episode;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use App\Services\Xai\XaiClient;
use Inertia\Inertia;
use Inertia\Response;

final class StudioDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $recentRuns = ProductionRun::query()
            ->with('productionSpec')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (ProductionRun $run): array => [
                'id' => $run->id,
                'status' => $run->status->value,
                'currentStage' => $run->current_stage?->value,
                'specTitle' => $run->productionSpec?->title,
                'specSlug' => $run->productionSpec?->slug,
                'episodeSlug' => $run->productionSpec?->episode_slug,
                'href' => route('studio.runs.show', $run),
                'updatedAt' => $run->updated_at?->toIso8601String(),
            ]);

        $needsAttention = ProductionRun::query()
            ->whereIn('status', [
                ProductionRunStatus::AwaitingScriptReview->value,
                ProductionRunStatus::AwaitingFinalReview->value,
                ProductionRunStatus::Failed->value,
            ])
            ->with('productionSpec')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (ProductionRun $run): array => [
                'id' => $run->id,
                'status' => $run->status->value,
                'specTitle' => $run->productionSpec?->title,
                'href' => route('studio.runs.show', $run),
            ]);

        return Inertia::render('studio/dashboard', [
            'stats' => [
                'specs' => ProductionSpec::query()->count(),
                'runs' => ProductionRun::query()->count(),
                'awaitingReview' => ProductionRun::query()->whereIn('status', [
                    ProductionRunStatus::AwaitingScriptReview->value,
                    ProductionRunStatus::AwaitingFinalReview->value,
                ])->count(),
                'publishedEpisodes' => Episode::query()->where('status', EpisodeStatus::Published)->count(),
                'draftEpisodes' => Episode::query()->where('status', EpisodeStatus::Draft)->count(),
                'agentProfiles' => AgentProfile::query()->active()->count(),
            ],
            'recentRuns' => $recentRuns,
            'needsAttention' => $needsAttention,
            'xaiConfigured' => app(XaiClient::class)->isConfigured(),
        ]);
    }
}
