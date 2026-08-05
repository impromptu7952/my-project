<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\RetryProductionStage;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class RetryProductionRunController extends Controller
{
    public function store(ProductionRun $run, Request $request, RetryProductionStage $retry): RedirectResponse
    {
        $data = $request->validate([
            'chain' => ['nullable', 'in:a,b'],
        ]);

        $retry->handle($run, $request->user(), $data['chain'] ?? 'a');

        return back();
    }
}
