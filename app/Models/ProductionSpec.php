<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProductionSpecFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class ProductionSpec extends Model
{
    /** @use HasFactory<ProductionSpecFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'episode_slug',
        'topic_id',
        'episode_id',
        'spec',
        'version',
        'created_by',
    ];

    /**
     * @return BelongsTo<Topic, $this>
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * @return BelongsTo<Episode, $this>
     */
    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<ProductionRun, $this>
     */
    public function runs(): HasMany
    {
        return $this->hasMany(ProductionRun::class);
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
            'spec' => 'array',
        ];
    }
}
