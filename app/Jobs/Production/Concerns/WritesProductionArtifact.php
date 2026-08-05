<?php

declare(strict_types=1);

namespace App\Jobs\Production\Concerns;

use App\Enums\ArtifactKind;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use App\Services\Production\StageAgentService;
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
    ): void {
        $run = ProductionRun::query()->with('productionSpec')->find($runId);

        if ($run === null) {
            return;
        }

        if (! $this->canWriteArtifacts($run)) {
            return;
        }

        try {
            $run->update([
                'current_stage' => $stage,
                'error' => null,
            ]);

            $meta = $run->meta ?? [];
            $meta['last_stage'] = $stage->value;
            $run->update(['meta' => $meta]);

            $version = (int) ($run->artifacts()->where('kind', $kind->value)->max('version') ?? 0) + 1;
            $xai = app(XaiClient::class);

            if ($xai->isConfigured()) {
                $built = app(StageAgentService::class)->generate($run, $stage, $kind);
                ProductionArtifact::query()->updateOrCreate(
                    [
                        'production_run_id' => $run->id,
                        'kind' => $kind->value,
                        'version' => max(1, $version),
                    ],
                    [
                        'stage' => $stage->value,
                        'payload' => $built['payload'] ?? [],
                        'meta' => $built['meta'] ?? ['agent' => 'xai'],
                    ]
                );
            } else {
                app(StubProductionAgent::class)->writeArtifact($run, $stage, $kind, max(1, $version));
            }

            // Clear one-shot regenerate flag after successful write for that stage.
            $fresh = $run->fresh();
            if ($fresh !== null) {
                $meta = $fresh->meta ?? [];
                if (($meta['regenerate_stage'] ?? null) === $stage->value) {
                    unset($meta['allow_stage_write'], $meta['regenerate_stage']);
                    $fresh->update(['meta' => $meta]);
                }
            }
        } catch (Throwable $e) {
            $this->markFailedIfFinalAttempt($runId, $stage, $e);

            throw $e;
        }
    }

    protected function canWriteArtifacts(ProductionRun $run): bool
    {
        if (in_array($run->status, [
            ProductionRunStatus::RunningChainA,
            ProductionRunStatus::RunningChainB,
        ], true)) {
            return true;
        }

        return (bool) (($run->meta ?? [])['allow_stage_write'] ?? false);
    }

    protected function isAgentWritableStatus(ProductionRunStatus $status): bool
    {
        return in_array($status, [
            ProductionRunStatus::RunningChainA,
            ProductionRunStatus::RunningChainB,
        ], true);
    }

    protected function markFailedIfFinalAttempt(int $runId, ProductionStage $stage, Throwable $e): void
    {
        $attempts = method_exists($this, 'attempts') ? (int) $this->attempts() : 1;
        $tries = property_exists($this, 'tries') ? (int) $this->tries : 1;

        if ($attempts < $tries) {
            return;
        }

        DB::transaction(function () use ($runId, $stage, $e): void {
            /** @var ProductionRun|null $run */
            $run = ProductionRun::query()->lockForUpdate()->find($runId);

            if ($run === null) {
                return;
            }

            // For single-stage regenerate, record error without flipping approved runs to Failed.
            $meta = $run->meta ?? [];
            $isRegen = (bool) ($meta['allow_stage_write'] ?? false);

            if ($isRegen) {
                $meta['last_regenerate_error'] = $e->getMessage();
                unset($meta['allow_stage_write'], $meta['regenerate_stage']);
                $run->update([
                    'error' => $e->getMessage(),
                    'meta' => $meta,
                    'current_stage' => $stage,
                ]);

                return;
            }

            if (! $this->isAgentWritableStatus($run->status)) {
                return;
            }

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
