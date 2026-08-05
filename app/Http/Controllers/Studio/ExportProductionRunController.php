<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\ExportProductionRunPackage;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ExportProductionRunController extends Controller
{
    public function __construct(private ExportProductionRunPackage $export) {}

    public function show(ProductionRun $run): StreamedResponse
    {
        $result = $this->export->handle($run);
        $json = json_encode(
            $result['package'],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );

        return response()->streamDownload(
            function () use ($json): void {
                echo $json;
            },
            $result['filename'],
            [
                'Content-Type' => 'application/json; charset=UTF-8',
            ],
        );
    }
}
