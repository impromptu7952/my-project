<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\ApproveProductionStage;
use App\Enums\ProductionGate;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ApproveProductionRunController extends Controller
{
    public function store(ProductionRun $run, Request $request, ApproveProductionStage $approve): RedirectResponse
    {
        $data = $request->validate([
            'gate' => ['required', 'in:script,final'],
        ]);

        $approve->handle($run, ProductionGate::from($data['gate']), $request->user());

        return back();
    }
}
