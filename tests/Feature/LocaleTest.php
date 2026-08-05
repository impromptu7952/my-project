<?php

declare(strict_types=1);

test('default locale is shared with inertia', function (): void {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('locale', 'en')
            ->has('translations')
            ->has('availableLocales')
        );
});

test('locale cookie sets albanian', function (): void {
    $this->withUnencryptedCookie('locale', 'sq')
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->where('locale', 'sq')->has('translations');
            $props = $page->toArray()['props'] ?? [];
            // Fallback: inspect translations map key with dots
            expect($props['translations']['home.hero_title'] ?? null)
                ->toBe('Shiko, luaj, mëso bashkë');
        });
});

test('invalid locale cookie falls back', function (): void {
    $this->withUnencryptedCookie('locale', 'xx')
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('locale', 'en'));
});
