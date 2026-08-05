<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\ValidateProductionSpec;
use App\Http\Controllers\Controller;
use App\Models\ProductionSpec;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class ProductionSpecController extends Controller
{
    public function index(): Response
    {
        $specs = ProductionSpec::query()
            ->withCount('runs')
            ->latest()
            ->get()
            ->map(fn (ProductionSpec $spec): array => [
                'id' => $spec->id,
                'slug' => $spec->slug,
                'title' => $spec->title,
                'episodeSlug' => $spec->episode_slug,
                'runsCount' => $spec->runs_count,
                'updatedAt' => $spec->updated_at?->toIso8601String(),
            ]);

        return Inertia::render('studio/specs/index', [
            'specs' => $specs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('studio/specs/create');
    }

    public function store(Request $request, ValidateProductionSpec $validate): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'episode_slug' => ['required', 'string', 'max:255'],
            'spec' => ['required', 'array'],
        ]);

        $specPayload = $validate->handle($data['spec']);

        $spec = ProductionSpec::query()->create([
            'slug' => Str::slug($data['title']).'-'.Str::lower(Str::random(4)),
            'title' => $data['title'],
            'episode_slug' => $data['episode_slug'],
            'spec' => $specPayload,
            'version' => (string) ($specPayload['version'] ?? '1'),
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->route('studio.specs.show', $spec);
    }

    public function show(ProductionSpec $spec): Response
    {
        $spec->load(['runs' => fn ($q) => $q->latest()]);

        return Inertia::render('studio/specs/show', [
            'spec' => [
                'id' => $spec->id,
                'slug' => $spec->slug,
                'title' => $spec->title,
                'episodeSlug' => $spec->episode_slug,
                'spec' => $spec->spec,
                'version' => $spec->version,
            ],
            'runs' => $spec->runs->map(fn ($run) => [
                'id' => $run->id,
                'status' => $run->status->value,
                'currentStage' => $run->current_stage?->value,
                'startedAt' => $run->started_at?->toIso8601String(),
            ]),
        ]);
    }

    public function update(Request $request, ProductionSpec $spec, ValidateProductionSpec $validate): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'episode_slug' => ['required', 'string', 'max:255'],
            'spec' => ['required', 'array'],
        ]);

        $specPayload = $validate->handle($data['spec']);

        $spec->update([
            'title' => $data['title'],
            'episode_slug' => $data['episode_slug'],
            'spec' => $specPayload,
            'version' => (string) ($specPayload['version'] ?? $spec->version),
        ]);

        return redirect()
            ->route('studio.specs.show', $spec)
            ->with('success', 'Production spec updated.');
    }
}
