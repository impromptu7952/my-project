<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\UpdateStageNotes;
use App\Enums\ProductionStage;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class UpdateStageNotesController extends Controller
{
    public function __construct(private UpdateStageNotes $updateNotes) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $data = $request->validate([
            'stage' => ['required', Rule::enum(ProductionStage::class)],
            'notes' => ['required', 'string', 'max:5000'],
        ]);

        $this->updateNotes->handle(
            $run,
            ProductionStage::from($data['stage']),
            $data['notes'],
            $request->user(),
        );

        return back()->with('success', 'Stage notes saved.');
    }
}
