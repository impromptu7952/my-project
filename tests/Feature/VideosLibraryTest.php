<?php

declare(strict_types=1);

use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    Config::set('features.videos', true);
    $this->seed(ContentSeeder::class);
});

test('videos index lists topics and episodes', function (): void {
    $this->get(route('videos.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/index')
            ->has('episodes')
            ->has('topics')
            ->where('activeTopic', null));
});

test('videos index can filter by topic', function (): void {
    $this->get(route('videos.index', ['topic' => 'ngjyrat']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/index')
            ->where('activeTopic', 'ngjyrat')
            ->has('episodes', 1));
});

test('published video show includes episode id for progress', function (): void {
    $this->get(route('videos.show', 'ngjyrat-kuq-kalter-verdh-gjelber'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/show')
            ->has('episode.id')
            ->has('playback.src'));
});
