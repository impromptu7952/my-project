<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\PreviewVisualPackage;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;

final class PreviewVisualController extends Controller
{
    public function __construct(private PreviewVisualPackage $previewVisual) {}

    public function store(ProductionRun $run): RedirectResponse
    {
        $result = $this->previewVisual->handle($run);

        $meta = $run->meta ?? [];
        $meta['visual_preview'] = [
            ...$result,
            'generated_at' => now()->toIso8601String(),
        ];
        $run->update(['meta' => $meta]);

        return back()->with('success', "Visual preview built ({$result['stored_previews']} prompts).");
    }
}
