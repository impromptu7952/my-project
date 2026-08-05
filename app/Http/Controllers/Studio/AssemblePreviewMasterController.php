<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\AssemblePreviewMaster;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

final class AssemblePreviewMasterController extends Controller
{
    public function __construct(private AssemblePreviewMaster $assemble) {}

    public function store(ProductionRun $run): RedirectResponse
    {
        try {
            $result = $this->assemble->handle($run);
        } catch (HttpException $e) {
            return back()->withErrors(['assemble' => $e->getMessage()]);
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'assemble' => 'Assemble failed: '.$e->getMessage(),
            ]);
        }

        return back()->with(
            'success',
            "Local package master assembled ({$result['cards']} cards, {$result['duration_seconds']}s). Open Program output to watch.",
        );
    }
}
