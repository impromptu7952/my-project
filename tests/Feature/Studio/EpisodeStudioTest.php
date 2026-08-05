<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    Config::set('features.studio', true);
    $this->seed(ContentSeeder::class);
});

test('editor can open studio episodes index', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.episodes.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/episodes/index')
            ->has('episodes')
            ->has('specs'));
});

test('editor can open studio episode show', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.episodes.show', 'ngjyrat-kuq-kalter-verdh-gjelber'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/episodes/show')
            ->where('episode.slug', 'ngjyrat-kuq-kalter-verdh-gjelber')
            ->has('media')
            ->has('specs'));
});
