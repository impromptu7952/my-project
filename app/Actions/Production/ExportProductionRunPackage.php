<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Models\ProductionRun;

/**
 * Assemble a portable JSON package of the latest artifacts for a run.
 *
 * @return array{filename: string, package: array<string, mixed>}
 */
final readonly class ExportProductionRunPackage
{
    /**
     * @return array{filename: string, package: array<string, mixed>}
     */
    public function handle(ProductionRun $run): array
    {
        $run->loadMissing(['productionSpec', 'artifacts']);

        $latestByKind = [];
        foreach ($run->artifacts->sortByDesc('version') as $artifact) {
            $kind = $artifact->kind->value;
            if (isset($latestByKind[$kind])) {
                continue;
            }
            $latestByKind[$kind] = [
                'kind' => $kind,
                'stage' => $artifact->stage?->value ?? $artifact->stage,
                'version' => $artifact->version,
                'payload' => $artifact->payload,
                'meta' => $artifact->meta,
                'updated_at' => $artifact->updated_at?->toIso8601String(),
            ];
        }

        $spec = $run->productionSpec;

        $package = [
            'exported_at' => now()->toIso8601String(),
            'run' => [
                'id' => $run->id,
                'status' => $run->status->value,
                'current_stage' => $run->current_stage?->value,
                'agent_profile_map' => $run->agent_profile_map,
                'meta' => $run->meta,
                'script_approved_at' => $run->script_approved_at?->toIso8601String(),
                'final_approved_at' => $run->final_approved_at?->toIso8601String(),
            ],
            'spec' => $spec ? [
                'slug' => $spec->slug,
                'title' => $spec->title,
                'episode_slug' => $spec->episode_slug,
                'spec' => $spec->spec,
            ] : null,
            'character_bible' => config('brand.character'),
            'artifacts' => array_values($latestByKind),
            'artifact_kinds' => array_keys($latestByKind),
        ];

        $slug = $spec?->slug ?? 'run';
        $filename = "playzone-run-{$run->id}-{$slug}.json";

        return [
            'filename' => $filename,
            'package' => $package,
        ];
    }
}
