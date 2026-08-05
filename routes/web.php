<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('games')->name('games.')->group(function (): void {
    Route::inertia('memory', 'games/memory')->name('memory');
    Route::inertia('tic-tac-toe', 'games/tic-tac-toe')->name('tic-tac-toe');
    Route::inertia('whack-a-mole', 'games/whack-a-mole')->name('whack-a-mole');
    Route::inertia('color-pop', 'games/color-pop')->name('color-pop');
    Route::inertia('rock-paper-scissors', 'games/rock-paper-scissors')->name('rock-paper-scissors');
    Route::inertia('number-quest', 'games/number-quest')->name('number-quest');
});

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
