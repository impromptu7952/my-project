<?php

declare(strict_types=1);

namespace App\Actions\Media;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Models\Episode;
use App\Models\MediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

final readonly class UploadEpisodeVideo
{
    public function handle(Episode $episode, UploadedFile $file, MediaKind $kind = MediaKind::VideoMaster): MediaAsset
    {
        $allowed = config('media.self.allowed_mimes', ['video/mp4', 'video/webm']);
        $maxMb = (int) config('media.self.max_upload_mb', 512);
        $mime = $file->getMimeType() ?? $file->getClientMimeType();

        if ($kind === MediaKind::VideoMaster && ! in_array($mime, $allowed, true)) {
            throw ValidationException::withMessages([
                'video' => 'Only MP4/WebM videos are allowed.',
            ]);
        }

        if ($file->getSize() !== null && $file->getSize() > $maxMb * 1024 * 1024) {
            throw ValidationException::withMessages([
                'video' => "File exceeds maximum size of {$maxMb} MB.",
            ]);
        }

        $disk = (string) config('media.self.disk', 'public');
        $prefix = (string) config('media.self.path_prefix', 'episodes');
        $extension = $file->getClientOriginalExtension() ?: ($kind === MediaKind::Subtitle ? 'vtt' : 'mp4');
        $path = $file->storeAs(
            $prefix.'/'.$episode->slug,
            $kind->value.'.'.$extension,
            $disk
        );

        return MediaAsset::query()->updateOrCreate(
            [
                'episode_id' => $episode->id,
                'kind' => $kind->value,
                'provider' => MediaProvider::Self->value,
            ],
            [
                'disk' => $disk,
                'path' => $path,
                'mime_type' => $mime,
                'size_bytes' => $file->getSize(),
                'meta' => [
                    'original_name' => $file->getClientOriginalName(),
                ],
            ]
        );
    }
}
