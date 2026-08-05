<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Media\UploadEpisodeVideo;
use App\Enums\MediaKind;
use App\Http\Controllers\Controller;
use App\Models\Episode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class MediaUploadController extends Controller
{
    public function store(Request $request, Episode $episode, UploadEpisodeVideo $upload): RedirectResponse
    {
        $data = $request->validate([
            'video' => ['required', 'file', 'max:524288'],
            'kind' => ['nullable', 'in:video_master,subtitle,thumbnail'],
        ]);

        $kind = MediaKind::from($data['kind'] ?? 'video_master');
        $upload->handle($episode, $data['video'], $kind);

        return back()->with('success', 'Media uploaded.');
    }
}
