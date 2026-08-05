<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use Database\Factories\ProductionArtifactFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ProductionArtifact extends Model
{
    /** @use HasFactory<ProductionArtifactFactory> */
    use HasFactory;

    protected $fillable = [
        'production_run_id',
        'kind',
        'stage',
        'version',
        'payload',
        'meta',
    ];

    /**
     * @return BelongsTo<ProductionRun, $this>
     */
    public function productionRun(): BelongsTo
    {
        return $this->belongsTo(ProductionRun::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'kind' => ArtifactKind::class,
            'stage' => ProductionStage::class,
            'version' => 'integer',
            'payload' => 'array',
            'meta' => 'array',
        ];
    }
}
