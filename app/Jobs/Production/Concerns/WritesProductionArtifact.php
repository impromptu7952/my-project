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
use Illuminate\Support\Facades\DB;
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

        // Do not write artifacts if the run left an agent-running state (human reject, etc.).
        if (! $this->isAgentWritableStatus($run->status)) {
            return;
        }

        try {
            $run->update([
                'current_stage' => $stage,
                'error' => null,
            ]);

            // Persist failed_stage for resume-from-stage retries.
            $meta = $run->meta ?? [];
            $meta['last_stage'] = $stage->value;
            $run->update(['meta' => $meta]);

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
            $this->markFailedIfFinalAttempt($runId, $stage, $e);

            throw $e;
        }
    }

    private function isAgentWritableStatus(ProductionRunStatus $status): bool
    {
        return in_array($status, [
            ProductionRunStatus::RunningChainA,
            ProductionRunStatus::RunningChainB,
        ], true);
    }

    private function markFailedIfFinalAttempt(int $runId, ProductionStage $stage, Throwable $e): void
    {
        // Only mark Failed after the final queue attempt so automatic retries can recover.
        $attempts = method_exists($this, 'attempts') ? (int) $this->attempts() : 1;
        $tries = property_exists($this, 'tries') ? (int) $this->tries : 1;

        if ($attempts < $tries) {
            return;
        }

        DB::transaction(function () use ($runId, $stage, $e): void {
            /** @var ProductionRun|null $run */
            $run = ProductionRun::query()->lockForUpdate()->find($runId);

            if ($run === null || ! $this->isAgentWritableStatus($run->status)) {
                return;
            }

            $meta = $run->meta ?? [];
            $meta['failed_stage'] = $stage->value;

            $run->update([
                'status' => ProductionRunStatus::Failed,
                'error' => $e->getMessage(),
                'current_stage' => $stage,
                'meta' => $meta,
            ]);
        });
    }
}
