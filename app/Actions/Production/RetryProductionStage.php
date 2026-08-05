<?php

declare(strict_types=1);

namespace App\Actions\Production;

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
    public function handle(ProductionRun $run, User $editor, string $chain = 'a'): ProductionRun
    {
        return DB::transaction(function () use ($run, $editor, $chain): ProductionRun {
            /** @var ProductionRun $run */
            $run = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);

            if ($run->status !== ProductionRunStatus::Failed) {
                throw new HttpException(422, 'Only failed runs can be retried.');
            }

            $meta = $run->meta ?? [];
            $meta['retried_by'] = $editor->id;
            $meta['retried_at'] = now()->toIso8601String();

            if ($chain === 'b') {
                $run->update([
                    'status' => ProductionRunStatus::RunningChainB,
                    'current_stage' => ProductionStage::Storyboard,
                    'error' => null,
                    'meta' => $meta,
                ]);

                Bus::chain([
                    new StoryboardAgentJob($run->id),
                    new VisualPromptAgentJob($run->id),
                    new VoicePackageAgentJob($run->id),
                    new EditorPackageAgentJob($run->id),
                    new QualityReviewAgentJob($run->id),
                    new MarkAwaitingFinalReviewJob($run->id),
                ])->dispatch();
            } else {
                $run->update([
                    'status' => ProductionRunStatus::RunningChainA,
                    'current_stage' => ProductionStage::Curriculum,
                    'error' => null,
                    'meta' => $meta,
                ]);

                Bus::chain([
                    new CurriculumAgentJob($run->id),
                    new ScriptAgentJob($run->id),
                    new MarkAwaitingScriptReviewJob($run->id),
                ])->dispatch();
            }

            return $run->fresh() ?? $run;
        });
    }
}
