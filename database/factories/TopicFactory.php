<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AgeBand;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Topic>
 */
final class TopicFactory extends Factory
{
    protected $model = Topic::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'slug' => Str::slug($name),
            'name_sq' => $name,
            'name_en' => $name,
            'description_sq' => fake()->sentence(),
            'description_en' => fake()->sentence(),
            'age_band' => AgeBand::OneToThree,
            'skills' => ['language'],
            'sort_order' => 0,
        ];
    }
}
