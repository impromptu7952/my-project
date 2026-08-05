<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ProductionRunStatus;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Clone a run's artifacts into a new draft-ready run for further editing.
 * New run starts at AwaitingScriptReview if script exists, else Failed-free empty shell at AwaitingScriptReview with copied artifacts.
 */
final readonly class CloneProductionRun
{
    public function handle(ProductionRun $source, User $editor): ProductionRun
    {
        return DB::transaction(function () use ($source, $editor): ProductionRun {
            $source->load('artifacts');

            $clone = ProductionRun::query()->create([
                'production_spec_id' => $source->production_spec_id,
                'status' => ProductionRunStatus::AwaitingScriptReview,
                'current_stage' => $source->current_stage,
                'error' => null,
                'meta' => [
                    'cloned_from_run_id' => $source->id,
                    'cloned_at' => now()->toIso8601String(),
                ],
                'agent_profile_map' => $source->agent_profile_map,
                'started_by' => $editor->id,
                'started_at' => now(),
            ]);

            // Copy latest version of each artifact kind only.
            $latestByKind = [];
            foreach ($source->artifacts->sortByDesc('version') as $artifact) {
                $key = $artifact->kind->value;
                if (! isset($latestByKind[$key])) {
                    $latestByKind[$key] = $artifact;
                }
            }

            foreach ($latestByKind as $artifact) {
                /** @var ProductionArtifact $artifact */
                ProductionArtifact::query()->create([
                    'production_run_id' => $clone->id,
                    'kind' => $artifact->kind,
                    'stage' => $artifact->stage,
                    'version' => 1,
                    'payload' => $artifact->payload,
                    'meta' => array_merge($artifact->meta ?? [], [
                        'cloned_from_artifact_id' => $artifact->id,
                        'cloned_from_version' => $artifact->version,
                    ]),
                ]);
            }

            return $clone->fresh(['artifacts']) ?? $clone;
        });
    }
}
