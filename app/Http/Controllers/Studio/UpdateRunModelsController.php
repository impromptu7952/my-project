<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\UpdateRunModels;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use App\Support\XaiModelCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class UpdateRunModelsController extends Controller
{
    public function __construct(private UpdateRunModels $updateModels) {}

    public function update(Request $request, ProductionRun $run): RedirectResponse
    {
        $data = $request->validate([
            'text_model' => ['sometimes', 'nullable', 'string', Rule::in(XaiModelCatalog::textModelIds())],
            'video_model' => ['sometimes', 'nullable', 'string', Rule::in(XaiModelCatalog::videoModelIds())],
        ]);

        $this->updateModels->handle($run, $data);

        return back()->with('success', 'Model preferences saved for this run.');
    }
}
