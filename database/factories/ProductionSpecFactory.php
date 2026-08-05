<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ProductionSpec;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ProductionSpec>
 */
final class ProductionSpecFactory extends Factory
{
    protected $model = ProductionSpec::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'slug' => Str::slug($title).'-'.fake()->unique()->numerify('##'),
            'title' => $title,
            'episode_slug' => Str::slug($title),
            'topic_id' => null,
            'episode_id' => null,
            'spec' => [
                'version' => '1',
                'language' => 'sq',
                'age_band' => '1-3',
                'episode_slug' => Str::slug($title),
                'learning_goals' => ['colors'],
                'vocabulary' => [
                    ['word' => 'kuq', 'en' => 'red'],
                ],
                'structure' => [
                    ['block' => 'hello_song', 'duration_seconds' => 60],
                ],
                'principles' => [
                    'short_phrases' => true,
                    'pause_seconds' => 4,
                ],
                'outputs_required' => ['script', 'storyboard'],
            ],
            'version' => '1',
            'created_by' => User::factory(),
        ];
    }
}
