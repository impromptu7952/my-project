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
            'force_quality_override' => ['sometimes', 'boolean'],
            'override_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $approve->handle(
            $run,
            ProductionGate::from($data['gate']),
            $request->user(),
            (bool) ($data['force_quality_override'] ?? false),
            $data['override_reason'] ?? null,
        );

        return back();
    }
}
