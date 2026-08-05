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

final class EditorPackageAgentJob implements ShouldQueue
{
    use Queueable;
    use WritesProductionArtifact;

    public function __construct(public int $runId) {}

    public function handle(): void
    {
        $this->runWithStage($this->runId, ProductionStage::Editor, ArtifactKind::EditInstructions);

        $run = ProductionRun::query()->find($this->runId);
        if ($run === null) {
            return;
        }

        $run = $run->fresh() ?? $run;
        if (! $this->isAgentWritableStatus($run->status) && ! (($run->meta ?? [])['allow_stage_write'] ?? false)) {
            if (! $this->isAgentWritableStatus($run->status)) {
                return;
            }
        }

        foreach ([ArtifactKind::OnScreenText, ArtifactKind::SubtitlesVtt] as $kind) {
            $version = (int) ($run->artifacts()->where('kind', $kind->value)->max('version') ?? 0) + 1;
            $xai = app(XaiClient::class);

            if ($xai->isConfigured()) {
                $built = app(StageAgentService::class)->generate($run, ProductionStage::Editor, $kind);
                $run->artifacts()->create([
                    'kind' => $kind,
                    'stage' => ProductionStage::Editor,
                    'version' => max(1, $version),
                    'payload' => $built['payload'],
                    'meta' => $built['meta'],
                ]);
            } else {
                app(StubProductionAgent::class)->writeArtifact($run, ProductionStage::Editor, $kind, max(1, $version));
            }
        }
    }
}
