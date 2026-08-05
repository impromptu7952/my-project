<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductionRun>
 */
final class ProductionRunFactory extends Factory
{
    protected $model = ProductionRun::class;

    public function definition(): array
    {
        return [
            'production_spec_id' => ProductionSpec::factory(),
            'status' => ProductionRunStatus::RunningChainA,
            'current_stage' => ProductionStage::Curriculum,
            'error' => null,
            'meta' => [],
            'started_by' => User::factory(),
            'started_at' => now(),
        ];
    }
}
