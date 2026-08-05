<?php

declare(strict_types=1);

test('home page is available', function (): void {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});

test('game pages are available', function (string $route, string $component): void {
    $this->get(route($route))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    ['games.memory', 'games/memory'],
    ['games.tic-tac-toe', 'games/tic-tac-toe'],
    ['games.whack-a-mole', 'games/whack-a-mole'],
    ['games.color-pop', 'games/color-pop'],
    ['games.rock-paper-scissors', 'games/rock-paper-scissors'],
    ['games.number-quest', 'games/number-quest'],
]);
