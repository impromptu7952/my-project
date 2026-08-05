<?php

declare(strict_types=1);

use App\Models\CurriculumLink;
use App\Models\Game;
use App\Models\Topic;
use Database\Seeders\ContentSeeder;
use Illuminate\Validation\ValidationException;

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

test('ngjyrat episode links to color pop', function (): void {
    $this->get(route('videos.show', 'ngjyrat-kuq-kalter-verdh-gjelber'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('linkedGames', 1)
            ->where('linkedGames.0.slug', 'color-pop')
        );
});

test('topic level curriculum link uniqueness is enforced', function (): void {
    $topic = Topic::query()->where('slug', 'ngjyrat')->firstOrFail();
    $game = Game::query()->where('slug', 'color-pop')->firstOrFail();

    CurriculumLink::query()->create([
        'topic_id' => $topic->id,
        'episode_id' => null,
        'game_id' => $game->id,
        'relation' => 'reinforces',
        'sort_order' => 9,
    ]);

    expect(fn () => CurriculumLink::query()->create([
        'topic_id' => $topic->id,
        'episode_id' => null,
        'game_id' => $game->id,
        'relation' => 'reinforces',
        'sort_order' => 10,
    ]))->toThrow(ValidationException::class);
});
