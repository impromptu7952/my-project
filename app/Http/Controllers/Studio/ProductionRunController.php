<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\BuildPublishChecklist;
use App\Actions\Production\SummarizeRunUsage;
use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Http\Controllers\Controller;
use App\Models\AgentProfile;
use App\Models\Episode;
use App\Models\ProductionRun;
use App\Services\Xai\XaiClient;
use Inertia\Inertia;
use Inertia\Response;

final class ProductionRunController extends Controller
{
    public function show(
        ProductionRun $run,
        SummarizeRunUsage $summarizeUsage,
        BuildPublishChecklist $buildChecklist,
    ): Response {

        $run->load(['productionSpec', 'artifacts', 'starter']);

        $latestByKind = [];
        foreach ($run->artifacts->sortByDesc('version') as $artifact) {
            $key = $artifact->kind->value;
            if (! isset($latestByKind[$key])) {
                $latestByKind[$key] = $artifact;
            }
        }

        $profiles = AgentProfile::query()
            ->active()
            ->orderBy('stage')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->groupBy(fn (AgentProfile $p) => $p->stage->value)
            ->map(fn ($group) => $group->map(fn (AgentProfile $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'isDefault' => $p->is_default,
                'model' => $p->model,
            ])->values());

        $steps = $this->steps($latestByKind);

        $episodeSlug = $run->productionSpec?->episode_slug;
        $episode = $episodeSlug
            ? Episode::query()->where('slug', $episodeSlug)->with('mediaAssets')->first()
            : null;

        return Inertia::render('studio/runs/show', [
            'run' => [
                'id' => $run->id,
                'status' => $run->status->value,
                'currentStage' => $run->current_stage?->value,
                'error' => $run->error,
                'startedAt' => $run->started_at?->toIso8601String(),
                'scriptApprovedAt' => $run->script_approved_at?->toIso8601String(),
                'finalApprovedAt' => $run->final_approved_at?->toIso8601String(),
                'agentProfileMap' => $run->agent_profile_map ?? [],
                'meta' => $run->meta ?? [],
                'spec' => [
                    'slug' => $run->productionSpec?->slug,
                    'title' => $run->productionSpec?->title,
                    'episodeSlug' => $run->productionSpec?->episode_slug,
                    'spec' => $run->productionSpec?->spec,
                ],
                'artifacts' => $run->artifacts->sortBy([
                    ['kind', 'asc'],
                    ['version', 'desc'],
                ])->values()->map(fn ($a) => [
                    'id' => $a->id,
                    'kind' => $a->kind->value,
                    'stage' => $a->stage?->value,
                    'version' => $a->version,
                    'payload' => $a->payload,
                    'meta' => $a->meta,
                    'updatedAt' => $a->updated_at?->toIso8601String(),
                ]),
                'latestByKind' => collect($latestByKind)->map(fn ($a) => [
                    'id' => $a->id,
                    'kind' => $a->kind->value,
                    'stage' => $a->stage?->value,
                    'version' => $a->version,
                    'payload' => $a->payload,
                    'meta' => $a->meta,
                ]),
            ],
            'steps' => $steps,
            'agentProfilesByStage' => $profiles,
            'xaiConfigured' => app(XaiClient::class)->isConfigured(),
            'usage' => $summarizeUsage->handle($run),
            'publishChecklist' => $buildChecklist->handle($run),
            'episodeMedia' => $episode ? [
                'slug' => $episode->slug,
                'media' => $episode->mediaAssets->map(fn ($m) => [
                    'id' => $m->id,
                    'kind' => $m->kind->value,
                    'mimeType' => $m->mime_type,
                    'sizeBytes' => $m->size_bytes,
                    'url' => $m->studioUrl(),
                ]),
            ] : null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $latestByKind
     * @return list<array<string, mixed>>
     */
    private function steps(array $latestByKind): array
    {
        $defs = [
            [
                'id' => ProductionStage::Curriculum->value,
                'label' => 'Brief / Curriculum',
                'kinds' => [ArtifactKind::Curriculum->value],
                'description' => 'Learning goals, vocabulary, structure',
            ],
            [
                'id' => ProductionStage::Script->value,
                'label' => 'Script',
                'kinds' => [ArtifactKind::Script->value],
                'description' => 'Dialogue, songs, pauses, interactions',
            ],
            [
                'id' => ProductionStage::Voice->value,
                'label' => 'Voice',
                'kinds' => [ArtifactKind::VoScript->value, ArtifactKind::TtsManifest->value],
                'description' => 'VO lines and TTS cues',
            ],
            [
                'id' => ProductionStage::Storyboard->value,
                'label' => 'Storyboard',
                'kinds' => [ArtifactKind::Storyboard->value, ArtifactKind::ShotList->value],
                'description' => 'Scenes and shots',
            ],
            [
                'id' => ProductionStage::VisualPrompts->value,
                'label' => 'Visuals',
                'kinds' => [
                    ArtifactKind::ImagePrompts->value,
                    ArtifactKind::VideoPrompts->value,
                    ArtifactKind::ThumbnailConcept->value,
                ],
                'description' => 'Image/video prompts and thumbnail',
            ],
            [
                'id' => ProductionStage::Editor->value,
                'label' => 'Edit package',
                'kinds' => [
                    ArtifactKind::EditInstructions->value,
                    ArtifactKind::OnScreenText->value,
                    ArtifactKind::SubtitlesVtt->value,
                ],
                'description' => 'EDL, captions, on-screen text',
            ],
            [
                'id' => ProductionStage::Quality->value,
                'label' => 'Quality',
                'kinds' => [ArtifactKind::QualityReport->value],
                'description' => 'ECE + safety review',
            ],
        ];

        return array_map(function (array $step) use ($latestByKind): array {
            $ready = false;
            foreach ($step['kinds'] as $kind) {
                if (isset($latestByKind[$kind])) {
                    $ready = true;
                    break;
                }
            }

            return [...$step, 'ready' => $ready];
        }, $defs);
    }
}
