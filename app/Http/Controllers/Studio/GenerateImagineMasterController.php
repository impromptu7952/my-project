<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\GenerateImagineMaster;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use App\Support\XaiModelCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

final class GenerateImagineMasterController extends Controller
{
    public function __construct(private GenerateImagineMaster $generate) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $min = (int) config('services.xai.video_duration_min', 3);
        $max = (int) config('services.xai.video_duration_max', 12);

        $data = $request->validate([
            'duration' => ['sometimes', 'integer', "min:{$min}", "max:{$max}"],
            'model' => ['sometimes', 'string', Rule::in(XaiModelCatalog::videoModelIds())],
        ]);

        $duration = isset($data['duration'])
            ? (int) $data['duration']
            : (int) config('services.xai.video_duration', 3);

        $model = isset($data['model']) ? (string) $data['model'] : null;

        try {
            $result = $this->generate->handle($run, $duration, $model);
        } catch (Throwable $e) {
            return back()->withErrors([
                'imagine' => $e->getMessage(),
            ]);
        }

        $usd = number_format((float) ($result['estimated_usd'] ?? 0), 2);
        $usedModel = $model ?? XaiModelCatalog::defaultVideoModel();

        return back()->with(
            'success',
            "Imagine master attached ({$usedModel}, ~\${$usd} est.). Refresh Program output to watch.",
        );
    }
}
