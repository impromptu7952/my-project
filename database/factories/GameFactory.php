<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AgeBand;
use App\Models\Game;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Game>
 */
final class GameFactory extends Factory
{
    protected $model = Game::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);
        $slug = Str::slug($name);

        return [
            'slug' => $slug,
            'route_name' => 'games.'.$slug,
            'name_sq' => $name,
            'name_en' => $name,
            'description_sq' => fake()->sentence(),
            'description_en' => fake()->sentence(),
            'age_band' => AgeBand::ThreeToFive,
            'emoji' => '🎮',
            'badge_sq' => 'Lojë',
            'badge_en' => 'Game',
            'gradient' => 'from-sky-400 to-blue-600',
            'featured_for_toddlers' => false,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }
}
