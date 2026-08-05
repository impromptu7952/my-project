<?php

declare(strict_types=1);

namespace App\Jobs\Production;

use App\Actions\Production\RunDeterministicQualityChecks;
use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Jobs\Production\Concerns\WritesProductionArtifact;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use App\Services\Production\StageAgentService;
use App\Services\Xai\XaiClient;
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

        if (! $this->canWriteArtifacts($run)) {
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
            $payload = ['deterministic' => $checks];

            $xai = app(XaiClient::class);
            if ($xai->isConfigured()) {
                try {
                    $built = app(StageAgentService::class)->generate(
                        $run->fresh() ?? $run,
                        ProductionStage::Quality,
                        ArtifactKind::QualityReport,
                    );
                    $payload['llm'] = $built['payload'];
                    $payload['passed'] = (bool) ($checks['passed'] ?? false)
                        && (bool) ($built['payload']['passed'] ?? true);
                } catch (Throwable $e) {
                    $payload['llm_error'] = $e->getMessage();
                    $payload['passed'] = (bool) ($checks['passed'] ?? false);
                }
            } else {
                $payload['passed'] = (bool) ($checks['passed'] ?? false);
            }

            $version = (int) ($run->artifacts()->where('kind', ArtifactKind::QualityReport->value)->max('version') ?? 0) + 1;

            ProductionArtifact::query()->updateOrCreate(
                [
                    'production_run_id' => $run->id,
                    'kind' => ArtifactKind::QualityReport->value,
                    'version' => max(1, $version),
                ],
                [
                    'stage' => ProductionStage::Quality->value,
                    'payload' => $payload,
                    'meta' => ['agent' => $xai->isConfigured() ? 'xai+deterministic' : 'deterministic'],
                ]
            );

            $fresh = $run->fresh();
            if ($fresh !== null) {
                $meta = $fresh->meta ?? [];
                if (($meta['regenerate_stage'] ?? null) === ProductionStage::Quality->value) {
                    unset($meta['allow_stage_write'], $meta['regenerate_stage']);
                    $fresh->update(['meta' => $meta]);
                }
            }
        } catch (Throwable $e) {
            $this->markFailedIfFinalAttempt($this->runId, ProductionStage::Quality, $e);

            throw $e;
        }
    }
}
