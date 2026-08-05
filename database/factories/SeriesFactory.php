<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Series;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Series>
 */
final class SeriesFactory extends Factory
{
    protected $model = Series::class;

    public function definition(): array
    {
        $title = fake()->unique()->words(3, true);

        return [
            'topic_id' => Topic::factory(),
            'slug' => Str::slug($title),
            'title_sq' => $title,
            'title_en' => $title,
            'sort_order' => 0,
        ];
    }
}
