<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\ContentSeeder;

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

test('guests cannot access studio', function (): void {
    $this->get(route('studio.specs.index'))->assertRedirect();
});

test('non editors cannot access studio', function (): void {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->get(route('studio.specs.index'))
        ->assertForbidden();
});

test('editors can access studio', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.specs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('studio/specs/index')->has('specs'));
});

test('unverified editors are redirected', function (): void {
    $editor = User::factory()->unverified()->create();
    $editor->forceFill(['is_editor' => true])->save();

    $this->actingAs($editor)
        ->get(route('studio.specs.index'))
        ->assertRedirect();
});
