<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

final class PrivacyController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('privacy', [
            'locale' => app()->getLocale(),
        ]);
    }
}
