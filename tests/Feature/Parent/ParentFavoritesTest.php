<?php

declare(strict_types=1);

use App\Models\Episode;
use App\Models\User;
use Database\Seeders\ContentSeeder;

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

test('verified parent can favorite episode', function (): void {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $episode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->firstOrFail();

    $this->actingAs($user)
        ->post(route('parent.favorites.store'), ['episode_id' => $episode->id])
        ->assertRedirect();

    $this->assertDatabaseHas('parent_favorites', [
        'user_id' => $user->id,
        'episode_id' => $episode->id,
    ]);
});

test('favorites index requires auth', function (): void {
    $this->get(route('parent.favorites'))->assertRedirect();
});
