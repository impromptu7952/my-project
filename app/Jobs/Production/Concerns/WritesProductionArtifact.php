<?php

declare(strict_types=1);

namespace App\Jobs\Production\Concerns;

use App\Enums\ArtifactKind;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use App\Services\Production\StubProductionAgent;
use App\Services\Xai\XaiClient;
use Throwable;

trait WritesProductionArtifact
{
    public int $timeout = 300;

    /** @var list<int> */
    public array $backoff = [30, 60];

    public int $tries = 2;

    protected function runWithStage(
        int $runId,
        ProductionStage $stage,
        ArtifactKind $kind,
        ?callable $xaiBuilder = null,
    ): void {
        $run = ProductionRun::query()->with('productionSpec')->find($runId);

        if ($run === null) {
            return;
        }

        try {
            $run->update(['current_stage' => $stage]);

            $xai = app(XaiClient::class);
            $version = (int) ($run->artifacts()->where('kind', $kind->value)->max('version') ?? 0) + 1;

            if ($xai->isConfigured() && $xaiBuilder !== null) {
                $built = $xaiBuilder($run, $xai);
                ProductionArtifact::query()->updateOrCreate(
                    [
                        'production_run_id' => $run->id,
                        'kind' => $kind->value,
                        'version' => max(1, $version),
                    ],
                    [
                        'stage' => $stage->value,
                        'payload' => $built['payload'] ?? [],
                        'meta' => array_merge(['agent' => 'xai'], $built['meta'] ?? []),
                    ]
                );
            } else {
                app(StubProductionAgent::class)->writeArtifact($run, $stage, $kind, max(1, $version));
            }
        } catch (Throwable $e) {
            $run->update([
                'status' => ProductionRunStatus::Failed,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
