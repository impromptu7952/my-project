<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\RejectProductionRun;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class RejectProductionRunController extends Controller
{
    public function store(ProductionRun $run, Request $request, RejectProductionRun $reject): RedirectResponse
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $reject->handle($run, $request->user(), $data['reason'] ?? null);

        return back();
    }
}
