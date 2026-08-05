<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Home\BuildHomeProps;
use Inertia\Inertia;
use Inertia\Response;

final class HomeController extends Controller
{
    public function show(BuildHomeProps $buildHomeProps): Response
    {
        return Inertia::render('welcome', $buildHomeProps->handle(app()->getLocale()));
    }
}
