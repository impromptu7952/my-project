<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use Database\Factories\ProductionRunFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class ProductionRun extends Model
{
    /** @use HasFactory<ProductionRunFactory> */
    use HasFactory;

    protected $fillable = [
        'production_spec_id',
        'status',
        'current_stage',
        'error',
        'meta',
        'agent_profile_map',
        'started_by',
        'started_at',
        'script_approved_by',
        'script_approved_at',
        'final_approved_by',
        'final_approved_at',
        'completed_at',
    ];

    /**
     * @return BelongsTo<ProductionSpec, $this>
     */
    public function productionSpec(): BelongsTo
    {
        return $this->belongsTo(ProductionSpec::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function starter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    /**
     * @return HasMany<ProductionArtifact, $this>
     */
    public function artifacts(): HasMany
    {
        return $this->hasMany(ProductionArtifact::class);
    }

    public function agentProfileIdFor(ProductionStage $stage): ?int
    {
        $map = $this->agent_profile_map ?? [];
        $id = $map[$stage->value] ?? null;

        return is_numeric($id) ? (int) $id : null;
    }

    /**
     * Latest artifact for a kind (highest version).
     */
    public function latestArtifact(string $kind): ?ProductionArtifact
    {
        return $this->artifacts()
            ->where('kind', $kind)
            ->orderByDesc('version')
            ->first();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ProductionRunStatus::class,
            'current_stage' => ProductionStage::class,
            'meta' => 'array',
            'agent_profile_map' => 'array',
            'started_at' => 'datetime',
            'script_approved_at' => 'datetime',
            'final_approved_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
