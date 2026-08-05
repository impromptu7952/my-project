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
        $run->loadMissing('productionSpec');

        $data = $request->validate([
            'episode_slug' => ['nullable', 'string'],
        ]);

        $spec = $run->productionSpec;
        $slug = $data['episode_slug'] ?? $spec?->episode_slug;

        if ($spec?->episode_id) {
            $episode = Episode::query()->findOrFail($spec->episode_id);
        } else {
            abort_if(blank($slug), 422, 'episode_slug is required when the production spec has no episode_id.');
            $episode = Episode::query()->where('slug', $slug)->firstOrFail();
        }

        $publish->handle($episode, $run, $request->user());

        return back();
    }
}
