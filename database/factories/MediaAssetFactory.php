<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Models\Episode;
use App\Models\MediaAsset;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MediaAsset>
 */
final class MediaAssetFactory extends Factory
{
    protected $model = MediaAsset::class;

    public function definition(): array
    {
        return [
            'episode_id' => Episode::factory(),
            'kind' => MediaKind::VideoMaster,
            'provider' => MediaProvider::Self,
            'disk' => 'public',
            'path' => 'episodes/sample.mp4',
            'external_id' => null,
            'mime_type' => 'video/mp4',
            'size_bytes' => 1024,
            'meta' => [],
        ];
    }
}
