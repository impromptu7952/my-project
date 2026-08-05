<?php

declare(strict_types=1);

namespace App\Jobs\Production;

use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\ProductionRun;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class MarkAwaitingScriptReviewJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 60;

    public function __construct(public int $runId) {}

    public function handle(): void
    {
        $run = ProductionRun::query()->find($this->runId);
        if ($run === null || $run->status === ProductionRunStatus::Failed) {
            return;
        }

        $run->update([
            'status' => ProductionRunStatus::AwaitingScriptReview,
            'current_stage' => ProductionStage::Script,
        ]);
    }
}
