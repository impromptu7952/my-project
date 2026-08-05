<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\EpisodeStatus;
use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use Database\Factories\MediaAssetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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

    /**
     * Playback/stream URL. Private disk assets are never exposed via /storage;
     * published episodes get a temporary signed stream URL; editors use auth stream.
     */
    public function publicUrl(): ?string
    {
        if ($this->provider !== MediaProvider::Self || blank($this->path)) {
            return null;
        }

        $this->loadMissing('episode');

        $episode = $this->episode;
        if ($episode === null) {
            return null;
        }

        // Only published episodes get anonymously streamable signed URLs.
        if ($episode->status !== EpisodeStatus::Published) {
            return null;
        }

        return URL::temporarySignedRoute(
            'media.stream',
            now()->addHours(2),
            ['mediaAsset' => $this->id],
        );
    }

    public function absolutePath(): ?string
    {
        if (blank($this->path)) {
            return null;
        }

        $disk = $this->disk ?? (string) config('media.self.disk', 'local');

        return Storage::disk($disk)->path((string) $this->path);
    }

    public function existsOnDisk(): bool
    {
        if (blank($this->path)) {
            return false;
        }

        $disk = $this->disk ?? (string) config('media.self.disk', 'local');

        return Storage::disk($disk)->exists((string) $this->path);
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
