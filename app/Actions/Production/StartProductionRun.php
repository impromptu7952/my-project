<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Actions\Production\Concerns\EnforcesProductionConcurrency;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Jobs\Production\CurriculumAgentJob;
use App\Jobs\Production\MarkAwaitingScriptReviewJob;
use App\Jobs\Production\ScriptAgentJob;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class StartProductionRun
{
    use EnforcesProductionConcurrency;

    public function handle(ProductionSpec $spec, User $editor): ProductionRun
    {
        if (RateLimiter::tooManyAttempts('production-start:'.$editor->id, maxAttempts: 2)) {
            throw new HttpException(429, 'Too many production starts. Try again shortly.');
        }

        $run = DB::transaction(function () use ($spec, $editor): ProductionRun {
            $this->assertGlobalOpenCapacity();
            $this->assertNoOpenRunOnSpec($spec);

            $run = ProductionRun::query()->create([
                'production_spec_id' => $spec->id,
                'status' => ProductionRunStatus::RunningChainA,
                'current_stage' => ProductionStage::Curriculum,
                'started_by' => $editor->id,
                'started_at' => now(),
            ]);

            $runId = $run->id;

            // Dispatch after commit so workers never see an uncommitted run row.
            DB::afterCommit(function () use ($runId): void {
                Bus::chain([
                    new CurriculumAgentJob($runId),
                    new ScriptAgentJob($runId),
                    new MarkAwaitingScriptReviewJob($runId),
                ])->dispatch();
            });

            return $run;
        });

        RateLimiter::hit('production-start:'.$editor->id, decaySeconds: 60);

        return $run;
    }
}
