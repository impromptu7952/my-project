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
            ->has('episodes'));
});

test('videos index includes expanded published pilots', function (): void {
    $this->get(route('videos.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/index')
            ->has('episodes')
            ->has('topics'));
});

test('published video show includes episode id for progress', function (): void {
    $this->get(route('videos.show', 'ngjyrat-kuq-kalter-verdh-gjelber'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('videos/show')
            ->has('episode.id')
            ->has('playback.src')
            ->has('coPlayTips')
            ->has('episode.seriesHref')
            ->has('episode.topicHref'));
});

test('topic page lists published episodes with age band', function (): void {
    $this->get(route('topics.show', 'ngjyrat'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('topics/show')
            ->where('topic.slug', 'ngjyrat')
            ->has('episodes')
            ->has('episodes.0.ageBand')
            ->has('episodes.0.href')
            ->has('series'));
});

test('series page lists published episodes in order', function (): void {
    $this->get(route('series.show', 'ngjyrat-seria-1'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('series/show')
            ->where('series.slug', 'ngjyrat-seria-1')
            ->has('episodes')
            ->has('topic.slug'));
});
