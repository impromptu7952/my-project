<?php

declare(strict_types=1);

namespace App\Jobs\Production;

use App\Actions\Production\RunDeterministicQualityChecks;
use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Jobs\Production\Concerns\WritesProductionArtifact;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

final class QualityReviewAgentJob implements ShouldQueue
{
    use Queueable;
    use WritesProductionArtifact;

    public function __construct(public int $runId) {}

    public function handle(): void
    {
        $run = ProductionRun::query()->with(['artifacts', 'productionSpec'])->find($this->runId);

        if ($run === null) {
            return;
        }

        // Same status gate as other agent jobs — never write after reject/fail/human leave.
        if (! $this->isAgentWritableStatus($run->status)) {
            return;
        }

        try {
            $run->update([
                'current_stage' => ProductionStage::Quality,
                'error' => null,
            ]);

            $meta = $run->meta ?? [];
            $meta['last_stage'] = ProductionStage::Quality->value;
            $run->update(['meta' => $meta]);

            $checks = app(RunDeterministicQualityChecks::class)->handle($run->fresh() ?? $run);

            $version = (int) ($run->artifacts()->where('kind', ArtifactKind::QualityReport->value)->max('version') ?? 0) + 1;

            ProductionArtifact::query()->updateOrCreate(
                [
                    'production_run_id' => $run->id,
                    'kind' => ArtifactKind::QualityReport->value,
                    'version' => max(1, $version),
                ],
                [
                    'stage' => ProductionStage::Quality->value,
                    'payload' => $checks,
                    'meta' => ['agent' => 'deterministic+stub'],
                ]
            );
        } catch (Throwable $e) {
            $this->markFailedIfFinalAttempt($this->runId, ProductionStage::Quality, $e);

            throw $e;
        }
    }
}
