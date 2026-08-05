<?php

declare(strict_types=1);

namespace App\Actions\Production;

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
    public function handle(ProductionSpec $spec, User $editor): ProductionRun
    {
        if (RateLimiter::tooManyAttempts('production-start:'.$editor->id, maxAttempts: 2)) {
            throw new HttpException(429, 'Too many production starts. Try again shortly.');
        }

        RateLimiter::hit('production-start:'.$editor->id, decaySeconds: 60);

        return DB::transaction(function () use ($spec, $editor): ProductionRun {
            $openValues = array_map(
                fn (ProductionRunStatus $s): string => $s->value,
                ProductionRunStatus::openStatuses()
            );

            $openCount = ProductionRun::query()
                ->whereIn('status', $openValues)
                ->lockForUpdate()
                ->count();

            if ($openCount >= 3) {
                throw new HttpException(503, 'Global production run limit reached (max 3 open).');
            }

            $openOnSpec = ProductionRun::query()
                ->where('production_spec_id', $spec->id)
                ->whereIn('status', $openValues)
                ->lockForUpdate()
                ->exists();

            if ($openOnSpec) {
                throw new HttpException(422, 'This production spec already has an open run.');
            }

            $run = ProductionRun::query()->create([
                'production_spec_id' => $spec->id,
                'status' => ProductionRunStatus::RunningChainA,
                'current_stage' => ProductionStage::Curriculum,
                'started_by' => $editor->id,
                'started_at' => now(),
            ]);

            Bus::chain([
                new CurriculumAgentJob($run->id),
                new ScriptAgentJob($run->id),
                new MarkAwaitingScriptReviewJob($run->id),
            ])->dispatch();

            return $run;
        });
    }
}
