<?php

declare(strict_types=1);

namespace App\Jobs\Production;

use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\ProductionRun;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

final class MarkAwaitingScriptReviewJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 60;

    public function __construct(public int $runId) {}

    public function handle(): void
    {
        DB::transaction(function (): void {
            /** @var ProductionRun|null $run */
            $run = ProductionRun::query()->lockForUpdate()->find($this->runId);

            if ($run === null) {
                return;
            }

            // Only transition from the expected running chain — never overwrite Failed/Rejected/etc.
            if ($run->status !== ProductionRunStatus::RunningChainA) {
                return;
            }

            $run->update([
                'status' => ProductionRunStatus::AwaitingScriptReview,
                'current_stage' => ProductionStage::Script,
            ]);
        });
    }
}
