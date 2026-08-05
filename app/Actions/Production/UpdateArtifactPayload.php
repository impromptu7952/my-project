<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ArtifactKind;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Manual editor save — always creates a new artifact version (history preserved).
 */
final readonly class UpdateArtifactPayload
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(
        ProductionRun $run,
        ArtifactKind $kind,
        array $payload,
        User $editor,
        ?ProductionStage $stage = null,
    ): ProductionArtifact {
        if (in_array($run->status, [
            ProductionRunStatus::RunningChainA,
            ProductionRunStatus::RunningChainB,
            ProductionRunStatus::Rejected,
        ], true)) {
            throw new HttpException(422, 'Cannot edit artifacts while the run is generating or rejected.');
        }

        return DB::transaction(function () use ($run, $kind, $payload, $editor, $stage): ProductionArtifact {
            /** @var ProductionRun $locked */
            $locked = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);

            $latest = $locked->latestArtifact($kind->value);
            $version = (int) ($latest?->version ?? 0) + 1;

            return ProductionArtifact::query()->create([
                'production_run_id' => $locked->id,
                'kind' => $kind,
                'stage' => $stage ?? $latest?->stage ?? $this->defaultStageFor($kind),
                'version' => $version,
                'payload' => $payload,
                'meta' => [
                    'source' => 'manual_edit',
                    'edited_by' => $editor->id,
                    'edited_at' => now()->toIso8601String(),
                    'previous_version' => $latest?->version,
                ],
            ]);
        });
    }

    private function defaultStageFor(ArtifactKind $kind): ProductionStage
    {
        return match ($kind) {
            ArtifactKind::Curriculum => ProductionStage::Curriculum,
            ArtifactKind::Script => ProductionStage::Script,
            ArtifactKind::Storyboard, ArtifactKind::ShotList => ProductionStage::Storyboard,
            ArtifactKind::ImagePrompts, ArtifactKind::VideoPrompts, ArtifactKind::ThumbnailConcept, ArtifactKind::VisualApproval => ProductionStage::VisualPrompts,
            ArtifactKind::VoScript, ArtifactKind::TtsManifest => ProductionStage::Voice,
            ArtifactKind::EditInstructions, ArtifactKind::OnScreenText, ArtifactKind::SubtitlesVtt => ProductionStage::Editor,
            ArtifactKind::QualityReport => ProductionStage::Quality,
        };
    }
}
