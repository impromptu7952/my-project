<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AgeBand;
use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Game extends Model
{
    /** @use HasFactory<GameFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'route_name',
        'name_sq',
        'name_en',
        'description_sq',
        'description_en',
        'age_band',
        'emoji',
        'badge_sq',
        'badge_en',
        'gradient',
        'featured_for_toddlers',
        'sort_order',
        'is_active',
    ];

    /**
     * @return HasMany<CurriculumLink, $this>
     */
    public function curriculumLinks(): HasMany
    {
        return $this->hasMany(CurriculumLink::class);
    }

    /**
     * @param  Builder<Game>  $query
     * @return Builder<Game>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Game>  $query
     * @return Builder<Game>
     */
    public function scopeToddlerFeatured(Builder $query): Builder
    {
        return $query->where('featured_for_toddlers', true);
    }

    public function localizedName(string $locale = 'sq'): string
    {
        return $locale === 'en' ? $this->name_en : $this->name_sq;
    }

    public function localizedDescription(string $locale = 'sq'): ?string
    {
        return $locale === 'en' ? $this->description_en : $this->description_sq;
    }

    public function localizedBadge(string $locale = 'sq'): ?string
    {
        return $locale === 'en' ? $this->badge_en : $this->badge_sq;
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
            'featured_for_toddlers' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
