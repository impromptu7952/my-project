<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Actions\Production\Concerns\EnforcesProductionConcurrency;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Jobs\Production\CurriculumAgentJob;
use App\Jobs\Production\EditorPackageAgentJob;
use App\Jobs\Production\MarkAwaitingFinalReviewJob;
use App\Jobs\Production\MarkAwaitingScriptReviewJob;
use App\Jobs\Production\QualityReviewAgentJob;
use App\Jobs\Production\ScriptAgentJob;
use App\Jobs\Production\StoryboardAgentJob;
use App\Jobs\Production\VisualPromptAgentJob;
use App\Jobs\Production\VoicePackageAgentJob;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class RetryProductionStage
{
    use EnforcesProductionConcurrency;

    public function handle(ProductionRun $run, User $editor, string $chain = 'a'): ProductionRun
    {
        return DB::transaction(function () use ($run, $editor, $chain): ProductionRun {
            /** @var ProductionRun $run */
            $run = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);

            if ($run->status !== ProductionRunStatus::Failed) {
                throw new HttpException(422, 'Only failed runs can be retried.');
            }

            $run->loadMissing('productionSpec');
            $spec = $run->productionSpec;

            if ($spec === null) {
                throw new HttpException(422, 'Production spec missing for run.');
            }

            // Retry re-opens the run — enforce same concurrency caps as Start.
            $this->assertGlobalOpenCapacity(exceptRunId: $run->id);
            $this->assertNoOpenRunOnSpec($spec, exceptRunId: $run->id);

            $meta = $run->meta ?? [];
            $meta['retried_by'] = $editor->id;
            $meta['retried_at'] = now()->toIso8601String();
            $failedStage = isset($meta['failed_stage'])
                ? ProductionStage::tryFrom((string) $meta['failed_stage'])
                : null;

            $runId = $run->id;

            if ($chain === 'b') {
                $startStage = $failedStage && $this->isChainBStage($failedStage)
                    ? $failedStage
                    : ProductionStage::Storyboard;

                $run->update([
                    'status' => ProductionRunStatus::RunningChainB,
                    'current_stage' => $startStage,
                    'error' => null,
                    'meta' => $meta,
                ]);

                $jobs = $this->chainBJobsFrom($runId, $startStage);

                DB::afterCommit(function () use ($jobs): void {
                    Bus::chain($jobs)->dispatch();
                });
            } else {
                $startStage = $failedStage && $this->isChainAStage($failedStage)
                    ? $failedStage
                    : ProductionStage::Curriculum;

                $run->update([
                    'status' => ProductionRunStatus::RunningChainA,
                    'current_stage' => $startStage,
                    'error' => null,
                    'meta' => $meta,
                ]);

                $jobs = $this->chainAJobsFrom($runId, $startStage);

                DB::afterCommit(function () use ($jobs): void {
                    Bus::chain($jobs)->dispatch();
                });
            }

            return $run->fresh() ?? $run;
        });
    }

    private function isChainAStage(ProductionStage $stage): bool
    {
        return in_array($stage, [ProductionStage::Curriculum, ProductionStage::Script], true);
    }

    private function isChainBStage(ProductionStage $stage): bool
    {
        return in_array($stage, [
            ProductionStage::Storyboard,
            ProductionStage::VisualPrompts,
            ProductionStage::Voice,
            ProductionStage::Editor,
            ProductionStage::Quality,
        ], true);
    }

    /**
     * @return list<object>
     */
    private function chainAJobsFrom(int $runId, ProductionStage $from): array
    {
        $all = [
            ProductionStage::Curriculum->value => new CurriculumAgentJob($runId),
            ProductionStage::Script->value => new ScriptAgentJob($runId),
        ];

        $ordered = [ProductionStage::Curriculum, ProductionStage::Script];
        $jobs = [];
        $include = false;

        foreach ($ordered as $stage) {
            if ($stage === $from) {
                $include = true;
            }
            if ($include) {
                $jobs[] = $all[$stage->value];
            }
        }

        $jobs[] = new MarkAwaitingScriptReviewJob($runId);

        return $jobs;
    }

    /**
     * @return list<object>
     */
    private function chainBJobsFrom(int $runId, ProductionStage $from): array
    {
        $map = [
            ProductionStage::Storyboard->value => new StoryboardAgentJob($runId),
            ProductionStage::VisualPrompts->value => new VisualPromptAgentJob($runId),
            ProductionStage::Voice->value => new VoicePackageAgentJob($runId),
            ProductionStage::Editor->value => new EditorPackageAgentJob($runId),
            ProductionStage::Quality->value => new QualityReviewAgentJob($runId),
        ];

        $ordered = [
            ProductionStage::Storyboard,
            ProductionStage::VisualPrompts,
            ProductionStage::Voice,
            ProductionStage::Editor,
            ProductionStage::Quality,
        ];

        $jobs = [];
        $include = false;

        foreach ($ordered as $stage) {
            if ($stage === $from) {
                $include = true;
            }
            if ($include) {
                $jobs[] = $map[$stage->value];
            }
        }

        $jobs[] = new MarkAwaitingFinalReviewJob($runId);

        return $jobs;
    }
}
