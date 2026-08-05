<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\PreviewVoicePackage;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;

final class PreviewVoiceController extends Controller
{
    public function __construct(private PreviewVoicePackage $previewVoice) {}

    public function store(ProductionRun $run): RedirectResponse
    {
        $result = $this->previewVoice->handle($run);

        $meta = $run->meta ?? [];
        $meta['tts_preview'] = [
            ...$result,
            'generated_at' => now()->toIso8601String(),
        ];
        $run->update(['meta' => $meta]);

        return back()->with('success', "Voice preview built ({$result['stored_previews']} cues).");
    }
}
