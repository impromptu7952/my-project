<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\StartProductionRun;
use App\Http\Controllers\Controller;
use App\Models\ProductionSpec;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class StartProductionRunController extends Controller
{
    public function store(ProductionSpec $spec, Request $request, StartProductionRun $start): RedirectResponse
    {
        $run = $start->handle($spec, $request->user());

        return redirect()->route('studio.runs.show', $run);
    }
}
