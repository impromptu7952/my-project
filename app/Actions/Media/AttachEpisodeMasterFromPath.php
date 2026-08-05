<?php

declare(strict_types=1);

namespace App\Actions\Media;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Models\Episode;
use App\Models\MediaAsset;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Store a generated local file as the episode video master (replaces previous self master).
 */
final readonly class AttachEpisodeMasterFromPath
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public function handle(
        Episode $episode,
        string $absoluteSourcePath,
        array $meta = [],
        ?string $vttContent = null,
    ): MediaAsset {
        if (! is_file($absoluteSourcePath)) {
            throw new RuntimeException('Source media file not found.');
        }

        $disk = (string) config('media.self.disk', 'public');
        $prefix = (string) config('media.self.path_prefix', 'episodes');
        $rel = $prefix.'/'.Str::uuid()->toString().'/video_master.mp4';

        $stream = fopen($absoluteSourcePath, 'rb');
        if ($stream === false) {
            throw new RuntimeException('Unable to open source media.');
        }

        try {
            Storage::disk($disk)->put($rel, $stream);
        } finally {
            fclose($stream);
        }

        $this->ensureWebVisible($disk, $rel);

        $size = Storage::disk($disk)->size($rel);

        $asset = MediaAsset::query()->updateOrCreate(
            [
                'episode_id' => $episode->id,
                'kind' => MediaKind::VideoMaster->value,
                'provider' => MediaProvider::Self->value,
            ],
            [
                'disk' => $disk,
                'path' => $rel,
                'mime_type' => 'video/mp4',
                'size_bytes' => $size,
                'meta' => array_merge([
                    'generated_at' => now()->toIso8601String(),
                ], $meta),
            ],
        );

        if (is_string($vttContent) && str_contains($vttContent, 'WEBVTT')) {
            $vttRel = $prefix.'/'.Str::uuid()->toString().'/subtitle.vtt';
            Storage::disk($disk)->put($vttRel, $vttContent);
            $this->ensureWebVisible($disk, $vttRel);
            MediaAsset::query()->updateOrCreate(
                [
                    'episode_id' => $episode->id,
                    'kind' => MediaKind::Subtitle->value,
                    'provider' => MediaProvider::Self->value,
                ],
                [
                    'disk' => $disk,
                    'path' => $vttRel,
                    'mime_type' => 'text/vtt',
                    'size_bytes' => mb_strlen($vttContent),
                    'meta' => [
                        'source' => $meta['source'] ?? 'package',
                        'generated_at' => now()->toIso8601String(),
                    ],
                ],
            );
        }

        return $asset;
    }

    /**
     * When public/storage is a real directory (not a symlink), mirror new files into it
     * so /storage/... URLs work with artisan serve / static hosting.
     */
    private function ensureWebVisible(string $disk, string $relativePath): void
    {
        if ($disk !== 'public') {
            return;
        }

        $publicStorage = public_path('storage');
        if (is_link($publicStorage)) {
            return;
        }

        $source = Storage::disk($disk)->path($relativePath);
        if (! is_file($source)) {
            return;
        }

        $target = $publicStorage.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
        $dir = dirname($target);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        if (! @copy($source, $target)) {
            // Non-fatal: Studio stream route still serves from the disk path.
        }
    }
}
