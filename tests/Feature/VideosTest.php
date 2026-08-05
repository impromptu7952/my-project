<?php

declare(strict_types=1);

use App\Enums\EpisodeStatus;
use App\Models\Episode;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
    Config::set('features.videos', true);
});

test('videos index lists published episodes', function (): void {
    $this->get(route('videos.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/index')
            ->has('episodes')
            ->where('episodes.0.slug', 'ngjyrat-kuq-kalter-verdh-gjelber')
        );
});

test('videos show published episode with playback', function (): void {
    $this->get(route('videos.show', 'ngjyrat-kuq-kalter-verdh-gjelber'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/show')
            ->where('episode.slug', 'ngjyrat-kuq-kalter-verdh-gjelber')
            ->has('playback.src')
            ->has('linkedGames')
        );
});

test('draft episodes return 404', function (): void {
    $episode = Episode::factory()->create([
        'status' => EpisodeStatus::Draft,
        'slug' => 'draft-only',
    ]);

    $this->get(route('videos.show', $episode))
        ->assertNotFound();
});

test('videos hidden when feature flag off', function (): void {
    Config::set('features.videos', false);

    $this->get(route('videos.index'))->assertNotFound();
});
