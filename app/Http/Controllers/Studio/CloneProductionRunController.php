<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\CloneProductionRun;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class CloneProductionRunController extends Controller
{
    public function __construct(private CloneProductionRun $cloneRun) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $clone = $this->cloneRun->handle($run, $request->user());

        return redirect()
            ->route('studio.runs.show', $clone)
            ->with('success', "Cloned run #{$run->id} → #{$clone->id} for further editing.");
    }
}
