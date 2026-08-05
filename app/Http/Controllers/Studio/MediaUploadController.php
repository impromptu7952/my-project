<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Media\UploadEpisodeVideo;
use App\Enums\MediaKind;
use App\Http\Controllers\Controller;
use App\Models\Episode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\File;

final class MediaUploadController extends Controller
{
    public function store(Request $request, Episode $episode, UploadEpisodeVideo $upload): RedirectResponse
    {
        $kindValue = $request->input('kind', 'video_master');
        $kind = MediaKind::from(is_string($kindValue) ? $kindValue : 'video_master');

        $mimes = match ($kind) {
            MediaKind::VideoMaster => ['mp4', 'webm'],
            MediaKind::Subtitle => ['vtt', 'txt'],
            MediaKind::Thumbnail => ['jpg', 'jpeg', 'png', 'webp'],
            MediaKind::Audio => ['mp3', 'm4a', 'aac', 'wav'],
        };

        $maxKb = (int) config('media.self.max_upload_mb', 512) * 1024;

        $data = $request->validate([
            'video' => ['required', File::types($mimes)->max($maxKb)],
            'kind' => ['nullable', 'in:video_master,subtitle,thumbnail,audio'],
        ]);

        $upload->handle($episode, $data['video'], $kind);

        return back()->with('success', 'Media uploaded.');
    }
}
