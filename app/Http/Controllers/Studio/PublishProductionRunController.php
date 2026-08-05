<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\PublishEpisode;
use App\Http\Controllers\Controller;
use App\Models\Episode;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class PublishProductionRunController extends Controller
{
    public function store(ProductionRun $run, Request $request, PublishEpisode $publish): RedirectResponse
    {
        $data = $request->validate([
            'episode_slug' => ['required', 'string'],
        ]);

        $episode = Episode::query()->where('slug', $data['episode_slug'])->firstOrFail();
        $publish->handle($episode, $run, $request->user());

        return back();
    }
}
