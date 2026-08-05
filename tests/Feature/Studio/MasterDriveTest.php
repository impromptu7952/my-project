<?php

declare(strict_types=1);

use App\Actions\Production\AssemblePreviewMaster;
use App\Actions\Production\StartProductionRun;
use App\Enums\ArtifactKind;
use App\Enums\MediaKind;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\Episode;
use App\Models\MediaAsset;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use App\Models\User;
use Database\Seeders\AgentProfileSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function (): void {
    Config::set('features.studio', true);
    $this->seed(ContentSeeder::class);
    $this->seed(AgentProfileSeeder::class);
    RateLimiter::clear('production-start:'.User::query()->where('email', 'editor@playzone.test')->value('id'));
});

test('assemble preview master builds video_master from script package', function (): void {
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'ngjyrat-pilot-v1')->firstOrFail();
    $run = app(StartProductionRun::class)->handle($spec, $editor);
    $run->update(['status' => ProductionRunStatus::AwaitingScriptReview]);

    // Ensure a script artifact exists (seeded package or create one).
    if ($run->artifacts()->where('kind', ArtifactKind::Script)->doesntExist()) {
        $run->artifacts()->create([
            'kind' => ArtifactKind::Script,
            'stage' => ProductionStage::Script,
            'version' => 1,
            'payload' => [
                'title' => 'Ngjyrat test',
                'sections' => [
                    [
                        'name' => 'open',
                        'duration_seconds' => 6,
                        'dialogue' => ['Përshëndetje!', 'E kuqe.'],
                        'pause_seconds' => 2,
                    ],
                ],
            ],
            'meta' => [],
        ]);
        $run->load('artifacts');
    }

    $result = app(AssemblePreviewMaster::class)->handle($run->fresh(['artifacts', 'productionSpec']));

    expect($result['method'])->toBe('assemble_local')
        ->and($result['cards'])->toBeGreaterThan(1)
        ->and($result['asset'])->toBeInstanceOf(MediaAsset::class)
        ->and($result['asset']->kind)->toBe(MediaKind::VideoMaster);

    $episode = Episode::query()->where('slug', $spec->episode_slug)->firstOrFail();
    $master = $episode->mediaAssets()->where('kind', MediaKind::VideoMaster)->first();
    expect($master)->not->toBeNull()
        ->and($master?->meta['source'] ?? null)->toBe('assemble_local');

    $run->refresh();
    expect($run->meta['last_master_drive']['method'] ?? null)->toBe('assemble_local');
});

test('editor can post assemble-preview route', function (): void {
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'ngjyrat-pilot-v1')->firstOrFail();
    $run = app(StartProductionRun::class)->handle($spec, $editor);
    $run->update(['status' => ProductionRunStatus::AwaitingScriptReview]);

    if ($run->artifacts()->where('kind', ArtifactKind::Script)->doesntExist()) {
        $run->artifacts()->create([
            'kind' => ArtifactKind::Script,
            'stage' => ProductionStage::Script,
            'version' => 1,
            'payload' => [
                'title' => 'Test',
                'sections' => [
                    ['dialogue' => ['Shumë mirë!'], 'duration_seconds' => 3],
                ],
            ],
            'meta' => [],
        ]);
    }

    $this->actingAs($editor)
        ->post(route('studio.runs.assemble-preview', $run))
        ->assertRedirect();

    $episode = Episode::query()->where('slug', $spec->episode_slug)->firstOrFail();
    expect(
        $episode->mediaAssets()->where('kind', MediaKind::VideoMaster)->where('meta->source', 'assemble_local')->exists()
            || $episode->mediaAssets()->where('kind', MediaKind::VideoMaster)->exists()
    )->toBeTrue();
});

test('imagine master requires api key', function (): void {
    Queue::fake();
    Config::set('services.xai.api_key', null);
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingScriptReview,
        'started_by' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('studio.runs.imagine-master', $run))
        ->assertRedirect()
        ->assertSessionHasErrors('imagine');
});
