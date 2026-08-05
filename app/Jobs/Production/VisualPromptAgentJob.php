<?php

declare(strict_types=1);

namespace App\Jobs\Production;

use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Jobs\Production\Concerns\WritesProductionArtifact;
use App\Models\ProductionRun;
use App\Services\Production\StageAgentService;
use App\Services\Production\StubProductionAgent;
use App\Services\Xai\XaiClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class VisualPromptAgentJob implements ShouldQueue
{
    use Queueable;
    use WritesProductionArtifact;

    public function __construct(public int $runId) {}

    public function handle(): void
    {
        $this->runWithStage($this->runId, ProductionStage::VisualPrompts, ArtifactKind::ImagePrompts);

        $run = ProductionRun::query()->find($this->runId);
        if ($run === null) {
            return;
        }

        $run = $run->fresh() ?? $run;
        if (! $this->canWriteArtifacts($run) && ! $this->isAgentWritableStatus($run->status)) {
            // After primary write, regenerate flag may clear — companions still OK if chain running.
            if (! $this->isAgentWritableStatus($run->status)) {
                return;
            }
        }

        foreach ([ArtifactKind::VideoPrompts, ArtifactKind::ThumbnailConcept] as $kind) {
            $this->writeCompanion($run, ProductionStage::VisualPrompts, $kind);
        }
    }

    private function writeCompanion(ProductionRun $run, ProductionStage $stage, ArtifactKind $kind): void
    {
        $version = (int) ($run->artifacts()->where('kind', $kind->value)->max('version') ?? 0) + 1;
        $xai = app(XaiClient::class);

        if ($xai->isConfigured()) {
            $built = app(StageAgentService::class)->generate($run, $stage, $kind);
            $run->artifacts()->create([
                'kind' => $kind,
                'stage' => $stage,
                'version' => max(1, $version),
                'payload' => $built['payload'],
                'meta' => $built['meta'],
            ]);
        } else {
            app(StubProductionAgent::class)->writeArtifact($run, $stage, $kind, max(1, $version));
        }
    }
}
