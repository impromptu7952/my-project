<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use Database\Factories\MediaAssetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

final class MediaAsset extends Model
{
    /** @use HasFactory<MediaAssetFactory> */
    use HasFactory;

    protected $fillable = [
        'episode_id',
        'kind',
        'provider',
        'disk',
        'path',
        'external_id',
        'mime_type',
        'size_bytes',
        'meta',
    ];

    /**
     * @return BelongsTo<Episode, $this>
     */
    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    public function publicUrl(): ?string
    {
        if ($this->provider !== MediaProvider::Self || blank($this->path)) {
            return null;
        }

        $disk = $this->disk ?? config('media.self.disk', 'public');

        return Storage::disk($disk)->url($this->path);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => MediaKind::class,
            'provider' => MediaProvider::class,
            'size_bytes' => 'integer',
            'meta' => 'array',
        ];
    }
}
