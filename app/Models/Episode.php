<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AgeBand;
use App\Enums\EpisodeStatus;
use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use Database\Factories\EpisodeFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Episode extends Model
{
    /** @use HasFactory<EpisodeFactory> */
    use HasFactory;

    protected $fillable = [
        'series_id',
        'slug',
        'title_sq',
        'title_en',
        'language',
        'age_band',
        'status',
        'duration_seconds',
        'episode_number',
        'sort_order',
        'summary_sq',
        'summary_en',
        'thumbnail_path',
        'published_at',
        'skills',
    ];

    /**
     * @return BelongsTo<Series, $this>
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    /**
     * @return HasMany<MediaAsset, $this>
     */
    public function mediaAssets(): HasMany
    {
        return $this->hasMany(MediaAsset::class);
    }

    /**
     * @return HasMany<CurriculumLink, $this>
     */
    public function curriculumLinks(): HasMany
    {
        return $this->hasMany(CurriculumLink::class);
    }

    /**
     * @param  Builder<Episode>  $query
     * @return Builder<Episode>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', EpisodeStatus::Published);
    }

    public function localizedTitle(string $locale = 'sq'): string
    {
        return $locale === 'en' && filled($this->title_en)
            ? (string) $this->title_en
            : $this->title_sq;
    }

    public function localizedSummary(string $locale = 'sq'): ?string
    {
        if ($locale === 'en' && filled($this->summary_en)) {
            return (string) $this->summary_en;
        }

        return $this->summary_sq;
    }

    public function videoMaster(): ?MediaAsset
    {
        return $this->mediaAssets
            ->first(fn (MediaAsset $asset): bool => $asset->kind === MediaKind::VideoMaster
                && $asset->provider === MediaProvider::Self);
    }

    public function subtitle(): ?MediaAsset
    {
        return $this->mediaAssets
            ->first(fn (MediaAsset $asset): bool => $asset->kind === MediaKind::Subtitle);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'age_band' => AgeBand::class,
            'status' => EpisodeStatus::class,
            'duration_seconds' => 'integer',
            'episode_number' => 'integer',
            'sort_order' => 'integer',
            'published_at' => 'datetime',
            'skills' => 'array',
        ];
    }
}
