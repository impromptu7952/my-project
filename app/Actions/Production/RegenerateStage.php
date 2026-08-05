<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Jobs\Production\CurriculumAgentJob;
use App\Jobs\Production\EditorPackageAgentJob;
use App\Jobs\Production\QualityReviewAgentJob;
use App\Jobs\Production\ScriptAgentJob;
use App\Jobs\Production\StoryboardAgentJob;
use App\Jobs\Production\VisualPromptAgentJob;
use App\Jobs\Production\VoicePackageAgentJob;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Re-run a single production stage (new artifact versions) without full pipeline reset.
 */
final readonly class RegenerateStage
{
    public function handle(
        ProductionRun $run,
        ProductionStage $stage,
        User $editor,
        ?int $agentProfileId = null,
    ): ProductionRun {
        if ($run->status === ProductionRunStatus::Rejected) {
            throw new HttpException(422, 'Rejected runs cannot regenerate stages. Start a new run.');
        }

        if (in_array($run->status, [
            ProductionRunStatus::RunningChainA,
            ProductionRunStatus::RunningChainB,
        ], true)) {
            throw new HttpException(422, 'Wait for the current pipeline segment to finish before regenerating a stage.');
        }

        return DB::transaction(function () use ($run, $stage, $editor, $agentProfileId): ProductionRun {
            /** @var ProductionRun $locked */
            $locked = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);

            $map = $locked->agent_profile_map ?? [];
            if ($agentProfileId !== null) {
                $map[$stage->value] = $agentProfileId;
            }

            $meta = $locked->meta ?? [];
            $meta['allow_stage_write'] = true;
            $meta['regenerate_stage'] = $stage->value;
            $meta['regenerate_requested_by'] = $editor->id;
            $meta['regenerate_requested_at'] = now()->toIso8601String();

            $locked->update([
                'agent_profile_map' => $map,
                'meta' => $meta,
                'current_stage' => $stage,
                'error' => null,
            ]);

            $job = $this->jobFor($stage, $locked->id);

            DB::afterCommit(function () use ($job): void {
                dispatch($job);
            });

            return $locked->fresh() ?? $locked;
        });
    }

    private function jobFor(ProductionStage $stage, int $runId): object
    {
        return match ($stage) {
            ProductionStage::Curriculum => new CurriculumAgentJob($runId),
            ProductionStage::Script => new ScriptAgentJob($runId),
            ProductionStage::Storyboard => new StoryboardAgentJob($runId),
            ProductionStage::VisualPrompts => new VisualPromptAgentJob($runId),
            ProductionStage::Voice => new VoicePackageAgentJob($runId),
            ProductionStage::Editor => new EditorPackageAgentJob($runId),
            ProductionStage::Quality => new QualityReviewAgentJob($runId),
        };
    }
}
