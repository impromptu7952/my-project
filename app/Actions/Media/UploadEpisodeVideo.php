<?php

declare(strict_types=1);

namespace App\Actions\Media;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Models\Episode;
use App\Models\MediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final readonly class UploadEpisodeVideo
{
    public function handle(Episode $episode, UploadedFile $file, MediaKind $kind = MediaKind::VideoMaster): MediaAsset
    {
        $maxMb = (int) config('media.self.max_upload_mb', 512);
        $mime = $file->getMimeType();

        if (! is_string($mime) || $mime === '') {
            throw ValidationException::withMessages([
                'video' => 'Unable to detect file MIME type.',
            ]);
        }

        $allowed = $this->allowedMimesFor($kind);
        if (! in_array($mime, $allowed, true)) {
            throw ValidationException::withMessages([
                'video' => sprintf(
                    'Invalid MIME type "%s" for %s. Allowed: %s',
                    $mime,
                    $kind->value,
                    implode(', ', $allowed)
                ),
            ]);
        }

        if ($file->getSize() !== null && $file->getSize() > $maxMb * 1024 * 1024) {
            throw ValidationException::withMessages([
                'video' => "File exceeds maximum size of {$maxMb} MB.",
            ]);
        }

        $extension = $this->extensionFor($kind, $mime, $file);
        $this->assertExtensionMatchesMime($extension, $kind);

        $disk = (string) config('media.self.disk', 'local');
        $prefix = (string) config('media.self.path_prefix', 'episodes');
        // Unguessable object key — do not use episode slug alone.
        $path = $file->storeAs(
            $prefix.'/'.Str::uuid()->toString(),
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

    /**
     * @return list<string>
     */
    private function allowedMimesFor(MediaKind $kind): array
    {
        return match ($kind) {
            MediaKind::VideoMaster, MediaKind::Audio => array_values(
                (array) config('media.self.allowed_mimes', ['video/mp4', 'video/webm'])
            ),
            MediaKind::Subtitle => array_values(
                (array) config('media.self.subtitle_mimes', ['text/vtt', 'text/plain'])
            ),
            MediaKind::Thumbnail => array_values(
                (array) config('media.self.thumbnail_mimes', ['image/jpeg', 'image/png', 'image/webp'])
            ),
        };
    }

    private function extensionFor(MediaKind $kind, string $mime, UploadedFile $file): string
    {
        $fromFile = mb_strtolower($file->getClientOriginalExtension() ?: '');

        return match ($kind) {
            MediaKind::VideoMaster => match ($mime) {
                'video/webm' => 'webm',
                default => 'mp4',
            },
            MediaKind::Subtitle => 'vtt',
            MediaKind::Thumbnail => match ($mime) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                default => 'jpg',
            },
            MediaKind::Audio => $fromFile !== '' ? $fromFile : 'm4a',
        };
    }

    private function assertExtensionMatchesMime(string $extension, MediaKind $kind): void
    {
        $ok = match ($kind) {
            MediaKind::VideoMaster => in_array($extension, ['mp4', 'webm'], true),
            MediaKind::Subtitle => $extension === 'vtt',
            MediaKind::Thumbnail => in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true),
            MediaKind::Audio => true,
        };

        if (! $ok) {
            throw ValidationException::withMessages([
                'video' => 'File extension does not match allowed types for this media kind.',
            ]);
        }
    }
}
