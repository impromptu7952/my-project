<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

final class BrandBibleController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('studio/brand', [
            'character' => config('brand.character'),
        ]);
    }
}
