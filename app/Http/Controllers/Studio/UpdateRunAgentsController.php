<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\UpdateRunAgentProfiles;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class UpdateRunAgentsController extends Controller
{
    public function __construct(private UpdateRunAgentProfiles $updateProfiles) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $data = $request->validate([
            'agent_profile_map' => ['required', 'array'],
            'agent_profile_map.*' => ['nullable', 'integer', 'exists:agent_profiles,id'],
        ]);

        $this->updateProfiles->handle($run, $data['agent_profile_map']);

        return redirect()
            ->route('studio.runs.show', $run)
            ->with('success', 'Agent assignments updated for this run.');
    }
}
