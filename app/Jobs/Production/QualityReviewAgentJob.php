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

        $run->update(['current_stage' => ProductionStage::Quality]);
        $checks = app(RunDeterministicQualityChecks::class)->handle($run);

        ProductionArtifact::query()->updateOrCreate(
            [
                'production_run_id' => $run->id,
                'kind' => ArtifactKind::QualityReport->value,
                'version' => 1,
            ],
            [
                'stage' => ProductionStage::Quality->value,
                'payload' => $checks,
                'meta' => ['agent' => 'deterministic+stub'],
            ]
        );
    }
}
