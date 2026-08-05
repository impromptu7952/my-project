<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AgeBand;
use App\Enums\EpisodeStatus;
use App\Models\Episode;
use App\Models\Series;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Episode>
 */
final class EpisodeFactory extends Factory
{
    protected $model = Episode::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'series_id' => Series::factory(),
            'slug' => Str::slug($title).'-'.fake()->unique()->numerify('###'),
            'title_sq' => $title,
            'title_en' => $title,
            'language' => 'sq',
            'age_band' => AgeBand::OneToThree,
            'status' => EpisodeStatus::Draft,
            'duration_seconds' => 120,
            'episode_number' => 1,
            'sort_order' => 0,
            'summary_sq' => fake()->sentence(),
            'summary_en' => fake()->sentence(),
            'thumbnail_path' => null,
            'published_at' => null,
            'skills' => ['language'],
        ];
    }

    public function published(): static
    {
        return $this->state(fn (): array => [
            'status' => EpisodeStatus::Published,
            'published_at' => now(),
        ]);
    }
}
