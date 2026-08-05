<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductionArtifact>
 */
final class ProductionArtifactFactory extends Factory
{
    protected $model = ProductionArtifact::class;

    public function definition(): array
    {
        return [
            'production_run_id' => ProductionRun::factory(),
            'kind' => ArtifactKind::Script,
            'stage' => ProductionStage::Script,
            'version' => 1,
            'payload' => ['text' => 'Hello'],
            'meta' => [],
        ];
    }
}
