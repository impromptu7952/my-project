<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Actions\Parent\UpdateWatchProgress;
use App\Enums\EpisodeStatus;
use App\Http\Controllers\Controller;
use App\Models\Episode;
use App\Models\WatchProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class WatchProgressController extends Controller
{
    public function index(Request $request): Response
    {
        $locale = app()->getLocale();
        $items = WatchProgress::query()
            ->where('user_id', $request->user()->id)
            ->with('episode')
            ->latest('last_watched_at')
            ->get()
            ->map(fn (WatchProgress $p): array => [
                'title' => $p->episode?->localizedTitle($locale),
                'positionSeconds' => $p->position_seconds,
                'durationSeconds' => $p->duration_seconds,
                'completed' => $p->completed,
                'href' => $p->episode ? route('videos.show', $p->episode) : null,
            ]);

        return Inertia::render('parent/progress', [
            'items' => $items,
        ]);
    }

    public function store(Request $request, UpdateWatchProgress $update): RedirectResponse
    {
        $data = $request->validate([
            'episode_id' => [
                'required',
                'integer',
                Rule::exists('episodes', 'id')->where('status', EpisodeStatus::Published->value),
            ],
            'position_seconds' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $episode = Episode::query()->findOrFail($data['episode_id']);
        $update->handle(
            $request->user(),
            $episode,
            (int) $data['position_seconds'],
            isset($data['duration_seconds']) ? (int) $data['duration_seconds'] : null,
        );

        return back();
    }
}
