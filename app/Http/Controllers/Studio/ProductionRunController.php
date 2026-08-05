<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Inertia\Inertia;
use Inertia\Response;

final class ProductionRunController extends Controller
{
    public function show(ProductionRun $run): Response
    {
        $run->load(['productionSpec', 'artifacts', 'starter']);

        return Inertia::render('studio/runs/show', [
            'run' => [
                'id' => $run->id,
                'status' => $run->status->value,
                'currentStage' => $run->current_stage?->value,
                'error' => $run->error,
                'startedAt' => $run->started_at?->toIso8601String(),
                'scriptApprovedAt' => $run->script_approved_at?->toIso8601String(),
                'finalApprovedAt' => $run->final_approved_at?->toIso8601String(),
                'spec' => [
                    'slug' => $run->productionSpec?->slug,
                    'title' => $run->productionSpec?->title,
                    'episodeSlug' => $run->productionSpec?->episode_slug,
                ],
                'artifacts' => $run->artifacts->map(fn ($a) => [
                    'id' => $a->id,
                    'kind' => $a->kind->value,
                    'stage' => $a->stage?->value,
                    'version' => $a->version,
                    'payload' => $a->payload,
                ]),
            ],
        ]);
    }
}
