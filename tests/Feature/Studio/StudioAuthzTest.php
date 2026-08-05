<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    Config::set('features.studio', true);
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

test('studio is disabled when feature flag is off', function (): void {
    Config::set('features.studio', false);
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.specs.index'))
        ->assertNotFound();
});

test('is_editor cannot be mass assigned', function (): void {
    expect(fn () => User::query()->create([
        'name' => 'Hacker',
        'email' => 'hacker@example.com',
        'password' => 'password',
        'is_editor' => true,
    ]))->toThrow(Illuminate\Database\Eloquent\MassAssignmentException::class);

    $user = User::query()->create([
        'name' => 'Normal',
        'email' => 'normal@example.com',
        'password' => 'password',
    ]);
    expect($user->fresh()->is_editor)->toBeFalse();
});
