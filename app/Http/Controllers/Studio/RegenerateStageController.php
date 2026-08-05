<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\RegenerateStage;
use App\Enums\ProductionStage;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class RegenerateStageController extends Controller
{
    public function __construct(private RegenerateStage $regenerateStage) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $data = $request->validate([
            'stage' => ['required', Rule::enum(ProductionStage::class)],
            'agent_profile_id' => ['nullable', 'integer', 'exists:agent_profiles,id'],
        ]);

        $this->regenerateStage->handle(
            $run,
            ProductionStage::from($data['stage']),
            $request->user(),
            isset($data['agent_profile_id']) ? (int) $data['agent_profile_id'] : null,
        );

        return redirect()
            ->route('studio.runs.show', $run)
            ->with('success', 'Stage regeneration queued. Refresh in a moment.');
    }
}
