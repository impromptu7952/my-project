<?php

declare(strict_types=1);

use App\Http\Controllers\EpisodeController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Parent\FavoriteController;
use App\Http\Controllers\Parent\WatchProgressController;
use App\Http\Controllers\PrivacyController;
use App\Http\Controllers\Studio\ApproveProductionRunController;
use App\Http\Controllers\Studio\MediaUploadController;
use App\Http\Controllers\Studio\ProductionRunController;
use App\Http\Controllers\Studio\ProductionSpecController;
use App\Http\Controllers\Studio\PublishProductionRunController;
use App\Http\Controllers\Studio\RejectProductionRunController;
use App\Http\Controllers\Studio\RetryProductionRunController;
use App\Http\Controllers\Studio\StartProductionRunController;
use App\Http\Controllers\TopicController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'show'])->name('home');
Route::get('/privacy', [PrivacyController::class, 'show'])->name('privacy');

Route::get('/videos', [EpisodeController::class, 'index'])->name('videos.index');
Route::get('/videos/{episode:slug}', [EpisodeController::class, 'show'])->name('videos.show');
Route::get('/topics/{topic:slug}', [TopicController::class, 'show'])->name('topics.show');

Route::prefix('games')->name('games.')->group(function (): void {
    Route::inertia('memory', 'games/memory')->name('memory');
    Route::inertia('tic-tac-toe', 'games/tic-tac-toe')->name('tic-tac-toe');
    Route::inertia('whack-a-mole', 'games/whack-a-mole')->name('whack-a-mole');
    Route::inertia('color-pop', 'games/color-pop')->name('color-pop');
    Route::inertia('rock-paper-scissors', 'games/rock-paper-scissors')->name('rock-paper-scissors');
    Route::inertia('number-quest', 'games/number-quest')->name('number-quest');
    Route::inertia('touch-and-tap', 'games/touch-and-tap')->name('touch-and-tap');
});

Route::middleware(['auth', 'verified'])->prefix('parent')->name('parent.')->group(function (): void {
    Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites');
    Route::post('/favorites', [FavoriteController::class, 'store'])->name('favorites.store');
    Route::get('/progress', [WatchProgressController::class, 'index'])->name('progress');
    Route::post('/progress', [WatchProgressController::class, 'store'])->name('progress.store');
});

Route::middleware(['auth', 'verified', 'can:manage-content'])->prefix('studio')->name('studio.')->group(function (): void {
    Route::get('/', [ProductionSpecController::class, 'index'])->name('specs.index');
    Route::get('/specs/create', [ProductionSpecController::class, 'create'])->name('specs.create');
    Route::post('/specs', [ProductionSpecController::class, 'store'])->name('specs.store');
    Route::get('/specs/{spec:slug}', [ProductionSpecController::class, 'show'])->name('specs.show');
    Route::post('/specs/{spec:slug}/runs', [StartProductionRunController::class, 'store'])->name('specs.start-run');

    Route::get('/runs/{run}', [ProductionRunController::class, 'show'])->name('runs.show');
    Route::post('/runs/{run}/approve', [ApproveProductionRunController::class, 'store'])->name('runs.approve');
    Route::post('/runs/{run}/reject', [RejectProductionRunController::class, 'store'])->name('runs.reject');
    Route::post('/runs/{run}/retry', [RetryProductionRunController::class, 'store'])->name('runs.retry');
    Route::post('/runs/{run}/publish', [PublishProductionRunController::class, 'store'])->name('runs.publish');

    Route::post('/episodes/{episode:slug}/media', [MediaUploadController::class, 'store'])->name('episodes.media');
});

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
