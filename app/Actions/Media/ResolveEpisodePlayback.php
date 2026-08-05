<?php

declare(strict_types=1);

namespace App\Actions\Media;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Models\Episode;
use App\Models\MediaAsset;

final readonly class ResolveEpisodePlayback
{
    /**
     * @return array{provider: string, src: ?string, captionsSrc: ?string, poster: ?string, mimeType: ?string}
     */
    public function handle(Episode $episode): array
    {
        $episode->loadMissing('mediaAssets');

        /** @var MediaAsset|null $video */
        $video = $episode->mediaAssets->first(
            fn (MediaAsset $asset): bool => $asset->kind === MediaKind::VideoMaster
                && $asset->provider === MediaProvider::Self
        );

        /** @var MediaAsset|null $captions */
        $captions = $episode->mediaAssets->first(
            fn (MediaAsset $asset): bool => $asset->kind === MediaKind::Subtitle
        );

        /** @var MediaAsset|null $thumb */
        $thumb = $episode->mediaAssets->first(
            fn (MediaAsset $asset): bool => $asset->kind === MediaKind::Thumbnail
        );

        return [
            'provider' => 'self',
            'src' => $video?->publicUrl(),
            'captionsSrc' => $captions?->publicUrl(),
            'poster' => $thumb?->publicUrl() ?? $episode->thumbnail_path,
            'mimeType' => $video?->mime_type ?? 'video/mp4',
        ];
    }
}
