<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductionStage;
use Database\Factories\AgentProfileFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AgentProfile extends Model
{
    /** @use HasFactory<AgentProfileFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'stage',
        'description',
        'system_prompt',
        'model',
        'max_tokens',
        'temperature',
        'is_default',
        'is_active',
        'meta',
        'updated_by',
    ];

    public static function defaultFor(ProductionStage $stage): ?self
    {
        return self::query()
            ->active()
            ->forStage($stage)
            ->where('is_default', true)
            ->first()
            ?? self::query()->active()->forStage($stage)->orderBy('id')->first();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeForStage(Builder $query, ProductionStage $stage): Builder
    {
        return $query->where('stage', $stage->value);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'stage' => ProductionStage::class,
            'max_tokens' => 'integer',
            'temperature' => 'float',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'meta' => 'array',
        ];
    }
}
