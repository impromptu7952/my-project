<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ArtifactKind;
use App\Enums\ProductionGate;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Jobs\Production\EditorPackageAgentJob;
use App\Jobs\Production\MarkAwaitingFinalReviewJob;
use App\Jobs\Production\QualityReviewAgentJob;
use App\Jobs\Production\StoryboardAgentJob;
use App\Jobs\Production\VisualPromptAgentJob;
use App\Jobs\Production\VoicePackageAgentJob;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class ApproveProductionStage
{
    public function handle(ProductionRun $run, ProductionGate $gate, User $editor): ProductionRun
    {
        return DB::transaction(function () use ($run, $gate, $editor): ProductionRun {
            /** @var ProductionRun $run */
            $run = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);

            if ($gate === ProductionGate::Script) {
                if ($run->status !== ProductionRunStatus::AwaitingScriptReview) {
                    throw new HttpException(422, 'Run is not awaiting script review.');
                }

                $run->update([
                    'status' => ProductionRunStatus::RunningChainB,
                    'current_stage' => ProductionStage::Storyboard,
                    'script_approved_by' => $editor->id,
                    'script_approved_at' => now(),
                ]);

                $runId = $run->id;

                DB::afterCommit(function () use ($runId): void {
                    Bus::chain([
                        new StoryboardAgentJob($runId),
                        new VisualPromptAgentJob($runId),
                        new VoicePackageAgentJob($runId),
                        new EditorPackageAgentJob($runId),
                        new QualityReviewAgentJob($runId),
                        new MarkAwaitingFinalReviewJob($runId),
                    ])->dispatch();
                });
            }

            if ($gate === ProductionGate::Final) {
                if ($run->status !== ProductionRunStatus::AwaitingFinalReview) {
                    throw new HttpException(422, 'Run is not awaiting final review.');
                }

                $run->loadMissing('artifacts');
                $report = $run->artifacts
                    ->where('kind', ArtifactKind::QualityReport)
                    ->sortByDesc('version')
                    ->first();

                if (is_array($report?->payload) && ($report->payload['passed'] ?? true) === false) {
                    throw new HttpException(422, 'Cannot approve final: deterministic quality checks failed.');
                }

                $run->update([
                    'status' => ProductionRunStatus::Approved,
                    'final_approved_by' => $editor->id,
                    'final_approved_at' => now(),
                    'completed_at' => now(),
                ]);
            }

            return $run->fresh() ?? $run;
        });
    }
}
