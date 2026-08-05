<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\GenerateImagineMaster;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Throwable;

final class GenerateImagineMasterController extends Controller
{
    public function __construct(private GenerateImagineMaster $generate) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $data = $request->validate([
            'duration' => ['sometimes', 'integer', 'min:3', 'max:12'],
        ]);

        try {
            $result = $this->generate->handle(
                $run,
                (int) ($data['duration'] ?? 6),
            );
        } catch (Throwable $e) {
            return back()->withErrors([
                'imagine' => $e->getMessage(),
            ]);
        }

        return back()->with(
            'success',
            'Imagine master attached. Program dock will show the new video after refresh.',
        );
    }
}
