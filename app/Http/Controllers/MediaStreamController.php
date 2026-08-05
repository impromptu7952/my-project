<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\EpisodeStatus;
use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class MediaStreamController extends Controller
{
    public function show(Request $request, MediaAsset $mediaAsset): BinaryFileResponse
    {
        $mediaAsset->loadMissing('episode');
        $episode = $mediaAsset->episode;

        abort_if($episode === null, 404);
        abort_if(blank($mediaAsset->path), 404);

        $user = $request->user();
        $isEditor = $user instanceof User && Gate::forUser($user)->allows('manage-content');
        $isPublished = $episode->status === EpisodeStatus::Published;

        // Published media: require valid temporary signature (anonymous watch).
        // Draft/unpublished: editors only (auth + manage-content).
        if ($isPublished) {
            abort_unless($request->hasValidSignature(), 403);
        } else {
            abort_unless($isEditor, 403);
        }

        $disk = $mediaAsset->disk ?? (string) config('media.self.disk', 'local');
        abort_unless(Storage::disk($disk)->exists((string) $mediaAsset->path), 404);

        $absolute = Storage::disk($disk)->path((string) $mediaAsset->path);
        $mime = $mediaAsset->mime_type ?? 'video/mp4';

        // BinaryFileResponse supports HTTP Range (needed for HTML5 seek/play).
        return response()->file($absolute, [
            'Content-Type' => $mime,
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
