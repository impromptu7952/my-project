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
     * Playback/stream URL for published media.
     *
     * Prefer public-disk relative `/storage/...` URLs so HTML5 video works with
     * `php artisan serve` (static files, multi-range friendly) and behind proxies
     * without host-mismatched signed absolute URLs.
     *
     * Private-disk published assets fall back to a relative signed stream route.
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

        // Only published episodes get anonymously streamable URLs.
        if ($episode->status !== EpisodeStatus::Published) {
            return null;
        }

        $disk = $this->disk ?? (string) config('media.self.disk', 'local');

        // Public disk: same-origin relative path (best for artisan serve + Tailscale).
        if ($disk === 'public') {
            return '/storage/'.mb_ltrim((string) $this->path, '/');
        }

        // Private disk: relative signed route (host-agnostic path signature).
        return URL::temporarySignedRoute(
            'media.stream',
            now()->addHours(2),
            ['mediaAsset' => $this->id],
            absolute: false,
        );
    }

    /**
     * URL for Studio (works for drafts and public disk).
     *
     * Prefer the authenticated media stream route so Studio always reads from the
     * configured Storage disk (with HTTP Range). Static /storage links break when
     * public/storage is a materialized copy instead of a symlink to storage/app/public.
     */
    public function studioUrl(): ?string
    {
        if ($this->provider !== MediaProvider::Self || blank($this->path)) {
            return null;
        }

        if (! $this->existsOnDisk()) {
            return null;
        }

        return route('media.stream', ['mediaAsset' => $this->id], absolute: false);
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
