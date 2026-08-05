<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AgeBand;
use Database\Factories\TopicFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Topic extends Model
{
    /** @use HasFactory<TopicFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'name_sq',
        'name_en',
        'description_sq',
        'description_en',
        'age_band',
        'skills',
        'sort_order',
    ];

    /**
     * @return HasMany<Series, $this>
     */
    public function series(): HasMany
    {
        return $this->hasMany(Series::class);
    }

    /**
     * @return HasMany<CurriculumLink, $this>
     */
    public function curriculumLinks(): HasMany
    {
        return $this->hasMany(CurriculumLink::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function localizedName(string $locale = 'sq'): string
    {
        return $locale === 'en' && filled($this->name_en)
            ? (string) $this->name_en
            : $this->name_sq;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'age_band' => AgeBand::class,
            'skills' => 'array',
            'sort_order' => 'integer',
        ];
    }
}
