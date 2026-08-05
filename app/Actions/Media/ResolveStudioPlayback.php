<?php

declare(strict_types=1);

namespace App\Actions\Media;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Models\Episode;
use App\Models\MediaAsset;

/**
 * Studio-facing playback (drafts allowed) via studioUrl().
 *
 * @return array{
 *     provider: string,
 *     src: ?string,
 *     captionsSrc: ?string,
 *     poster: ?string,
 *     mimeType: ?string,
 *     language: string,
 *     hasVideo: bool,
 *     hasCaptions: bool,
 *     videoUpdatedAt: ?string,
 *     cacheKey: string
 * }
 */
final readonly class ResolveStudioPlayback
{
    /**
     * @return array{
     *     provider: string,
     *     src: ?string,
     *     captionsSrc: ?string,
     *     poster: ?string,
     *     mimeType: ?string,
     *     language: string,
     *     hasVideo: bool,
     *     hasCaptions: bool,
     *     videoUpdatedAt: ?string,
     *     cacheKey: string
     * }
     */
    public function handle(Episode $episode): array
    {
        $episode->loadMissing('mediaAssets');

        /** @var MediaAsset|null $video */
        $video = $episode->mediaAssets
            ->filter(fn (MediaAsset $asset): bool => $asset->kind === MediaKind::VideoMaster
                && $asset->provider === MediaProvider::Self
                && filled($asset->path))
            ->sortByDesc(fn (MediaAsset $a) => $a->updated_at?->timestamp ?? 0)
            ->first();

        /** @var MediaAsset|null $captions */
        $captions = $episode->mediaAssets
            ->filter(fn (MediaAsset $asset): bool => $asset->kind === MediaKind::Subtitle
                && filled($asset->path))
            ->sortByDesc(fn (MediaAsset $a) => $a->updated_at?->timestamp ?? 0)
            ->first();

        /** @var MediaAsset|null $thumb */
        $thumb = $episode->mediaAssets
            ->filter(fn (MediaAsset $asset): bool => $asset->kind === MediaKind::Thumbnail
                && filled($asset->path))
            ->sortByDesc(fn (MediaAsset $a) => $a->updated_at?->timestamp ?? 0)
            ->first();

        $src = $video?->studioUrl();
        $captionsSrc = $captions?->studioUrl();
        $poster = $thumb?->studioUrl() ?? $episode->thumbnail_path;
        $videoUpdated = $video?->updated_at?->toIso8601String();
        $cacheKey = implode(':', array_filter([
            (string) ($video?->id ?? 0),
            (string) ($video?->updated_at?->timestamp ?? 0),
            (string) ($captions?->id ?? 0),
            (string) ($captions?->updated_at?->timestamp ?? 0),
        ]));

        // Bust CDN/browser cache when masters are re-uploaded.
        if (is_string($src) && $src !== '' && $videoUpdated !== null) {
            $src .= (str_contains($src, '?') ? '&' : '?').'v='.($video?->updated_at?->timestamp ?? time());
        }
        if (is_string($captionsSrc) && $captionsSrc !== '' && $captions?->updated_at) {
            $captionsSrc .= (str_contains($captionsSrc, '?') ? '&' : '?').'v='.$captions->updated_at->timestamp;
        }

        return [
            'provider' => 'self',
            'src' => $src,
            'captionsSrc' => $captionsSrc,
            'poster' => $poster,
            'mimeType' => $video?->mime_type ?? 'video/mp4',
            'language' => $episode->language ?: 'sq',
            'hasVideo' => is_string($src) && $src !== '',
            'hasCaptions' => is_string($captionsSrc) && $captionsSrc !== '',
            'videoUpdatedAt' => $videoUpdated,
            'cacheKey' => $cacheKey !== '' ? $cacheKey : 'none',
        ];
    }
}
