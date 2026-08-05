<?php

declare(strict_types=1);

namespace App\Jobs\Production;

use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Jobs\Production\Concerns\WritesProductionArtifact;
use App\Services\Production\StubProductionAgent;
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
        $run = \App\Models\ProductionRun::query()->find($this->runId);
        if ($run) {
            $stub = app(StubProductionAgent::class);
            $stub->writeArtifact($run, ProductionStage::Editor, ArtifactKind::OnScreenText);
            $stub->writeArtifact($run, ProductionStage::Editor, ArtifactKind::SubtitlesVtt);
        }
    }
}
