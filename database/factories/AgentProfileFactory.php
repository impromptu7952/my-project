<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProductionStage;
use App\Models\AgentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AgentProfile>
 */
final class AgentProfileFactory extends Factory
{
    protected $model = AgentProfile::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $stage = fake()->randomElement(ProductionStage::cases());
        $slug = Str::slug($stage->value.'-'.fake()->unique()->word());

        return [
            'slug' => $slug,
            'name' => ucfirst($stage->value).' agent',
            'stage' => $stage,
            'description' => fake()->sentence(),
            'system_prompt' => 'You are a helpful early childhood content agent. Reply with valid JSON only.',
            'model' => 'grok-4.5',
            'max_tokens' => 3000,
            'temperature' => 0.4,
            'is_default' => false,
            'is_active' => true,
            'meta' => [],
        ];
    }
}
