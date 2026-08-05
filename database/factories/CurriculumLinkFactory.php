<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CurriculumLink;
use App\Models\Episode;
use App\Models\Game;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CurriculumLink>
 */
final class CurriculumLinkFactory extends Factory
{
    protected $model = CurriculumLink::class;

    public function definition(): array
    {
        return [
            'topic_id' => null,
            'episode_id' => Episode::factory(),
            'game_id' => Game::factory(),
            'relation' => 'reinforces',
            'sort_order' => 0,
        ];
    }
}
