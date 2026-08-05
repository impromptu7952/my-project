<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Enums\ProductionStage;
use App\Http\Controllers\Controller;
use App\Models\AgentProfile;
use App\Support\XaiModelCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class AgentProfileController extends Controller
{
    public function index(): Response
    {
        $profiles = AgentProfile::query()
            ->orderBy('stage')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(fn (AgentProfile $p): array => $this->serialize($p));

        return Inertia::render('studio/agents/index', [
            'profiles' => $profiles,
            'stages' => collect(ProductionStage::cases())->map(fn (ProductionStage $s) => [
                'value' => $s->value,
                'label' => str_replace('_', ' ', $s->value),
            ]),
            'xaiConfigured' => filled(config('services.xai.api_key')),
            'textModels' => XaiModelCatalog::textModels(),
        ]);
    }

    public function edit(AgentProfile $agent): Response
    {
        return Inertia::render('studio/agents/edit', [
            'profile' => $this->serialize($agent),
            'stages' => collect(ProductionStage::cases())->map(fn (ProductionStage $s) => [
                'value' => $s->value,
                'label' => str_replace('_', ' ', $s->value),
            ]),
            'textModels' => XaiModelCatalog::textModels(),
        ]);
    }

    public function update(Request $request, AgentProfile $agent): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'system_prompt' => ['required', 'string', 'max:20000'],
            'model' => ['required', 'string', 'max:80', Rule::in(XaiModelCatalog::textModelIds())],
            'max_tokens' => ['required', 'integer', 'min:256', 'max:16000'],
            'temperature' => ['required', 'numeric', 'min:0', 'max:2'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        if (($data['is_default'] ?? false) === true) {
            AgentProfile::query()
                ->where('stage', $agent->stage)
                ->where('id', '!=', $agent->id)
                ->update(['is_default' => false]);
        }

        $agent->update([
            ...$data,
            'updated_by' => $request->user()?->id,
        ]);

        return redirect()
            ->route('studio.agents.edit', $agent)
            ->with('success', 'Agent profile saved.');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'stage' => ['required', Rule::enum(ProductionStage::class)],
            'description' => ['nullable', 'string', 'max:500'],
            'system_prompt' => ['required', 'string', 'max:20000'],
            'model' => ['required', 'string', 'max:80', Rule::in(XaiModelCatalog::textModelIds())],
            'max_tokens' => ['required', 'integer', 'min:256', 'max:16000'],
            'temperature' => ['required', 'numeric', 'min:0', 'max:2'],
            'is_default' => ['boolean'],
        ]);

        $stage = ProductionStage::from($data['stage']);
        $slug = Str::slug($data['name']).'-'.Str::lower(Str::random(4));

        if (($data['is_default'] ?? false) === true) {
            AgentProfile::query()->where('stage', $stage->value)->update(['is_default' => false]);
        }

        $profile = AgentProfile::query()->create([
            ...$data,
            'stage' => $stage,
            'slug' => $slug,
            'is_active' => true,
            'updated_by' => $request->user()?->id,
        ]);

        return redirect()->route('studio.agents.edit', $profile);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(AgentProfile $p): array
    {
        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'name' => $p->name,
            'stage' => $p->stage->value,
            'description' => $p->description,
            'systemPrompt' => $p->system_prompt,
            'model' => $p->model,
            'maxTokens' => $p->max_tokens,
            'temperature' => $p->temperature,
            'isDefault' => $p->is_default,
            'isActive' => $p->is_active,
            'updatedAt' => $p->updated_at?->toIso8601String(),
        ];
    }
}
