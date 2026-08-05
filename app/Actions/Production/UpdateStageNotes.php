<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ProductionStage;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateStageNotes
{
    public function handle(ProductionRun $run, ProductionStage $stage, string $notes, User $editor): ProductionRun
    {
        return DB::transaction(function () use ($run, $stage, $notes, $editor): ProductionRun {
            /** @var ProductionRun $locked */
            $locked = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);
            $meta = $locked->meta ?? [];
            $stageNotes = is_array($meta['stage_notes'] ?? null) ? $meta['stage_notes'] : [];
            $stageNotes[$stage->value] = [
                'notes' => $notes,
                'updated_by' => $editor->id,
                'updated_at' => now()->toIso8601String(),
            ];
            $meta['stage_notes'] = $stageNotes;
            $locked->update(['meta' => $meta]);

            return $locked->fresh() ?? $locked;
        });
    }
}
