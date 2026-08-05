<?php

declare(strict_types=1);

use App\Actions\Media\UploadEpisodeVideo;
use App\Enums\MediaKind;
use App\Models\Episode;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

beforeEach(function (): void {
    Config::set('features.studio', true);
    Config::set('media.self.disk', 'local');
    Storage::fake('local');
    $this->seed(ContentSeeder::class);
});

test('upload rejects invalid mime for video master', function (): void {
    $episode = Episode::factory()->create();
    $file = UploadedFile::fake()->create('notes.txt', 10, 'text/plain');

    expect(fn () => app(UploadEpisodeVideo::class)->handle($episode, $file, MediaKind::VideoMaster))
        ->toThrow(ValidationException::class);
});

test('upload rejects invalid mime for subtitle', function (): void {
    $episode = Episode::factory()->create();
    $file = UploadedFile::fake()->create('photo.jpg', 20, 'image/jpeg');

    expect(fn () => app(UploadEpisodeVideo::class)->handle($episode, $file, MediaKind::Subtitle))
        ->toThrow(ValidationException::class);
});

test('editor can upload video via studio route', function (): void {
    Storage::fake('local');
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $episode = Episode::factory()->create(['slug' => 'upload-test']);

    $file = UploadedFile::fake()->create('clip.mp4', 100, 'video/mp4');

    $this->actingAs($editor)
        ->post(route('studio.episodes.media', $episode), [
            'video' => $file,
            'kind' => 'video_master',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('media_assets', [
        'episode_id' => $episode->id,
        'kind' => 'video_master',
        'provider' => 'self',
    ]);
});
