<?php

declare(strict_types=1);

use App\Ai\Agents\ProductionStageAgent;
use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Models\ProductionRun;
use App\Models\User;
use App\Services\Production\StageAgentService;
use App\Support\XaiModelCatalog;
use Database\Seeders\AgentProfileSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    Config::set('features.studio', true);
    $this->seed(ContentSeeder::class);
    $this->seed(AgentProfileSeeder::class);
});

test('editor can update run text and video model preferences', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'started_by' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->put(route('studio.runs.models.update', $run), [
            'text_model' => 'grok-4.3',
            'video_model' => 'grok-imagine-video-1.5',
        ])
        ->assertRedirect();

    $run->refresh();
    expect($run->meta['text_model'] ?? null)->toBe('grok-4.3')
        ->and($run->meta['video_model'] ?? null)->toBe('grok-imagine-video-1.5');
});

test('run model update rejects unknown models', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'started_by' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->from(route('studio.runs.show', $run))
        ->put(route('studio.runs.models.update', $run), [
            'text_model' => 'not-a-real-model',
        ])
        ->assertSessionHasErrors('text_model');
});

test('run show exposes model catalogs for the UI', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'started_by' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->get(route('studio.runs.show', $run))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/runs/show')
            ->has('masterDrive.textModels')
            ->has('masterDrive.videoModels')
            ->where('masterDrive.textModel', XaiModelCatalog::defaultTextModel())
            ->where('masterDrive.videoModel', XaiModelCatalog::defaultVideoModel()));
});

test('stage agent service uses laravel ai sdk and run text model override', function (): void {
    Config::set('services.xai.api_key', 'test-key-not-used');
    Config::set('ai.providers.xai.key', 'test-key-not-used');

    ProductionStageAgent::fake([
        '{"title":"Ngjyrat","language":"sq","sections":[]}',
    ]);

    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'started_by' => $editor->id,
        'meta' => ['text_model' => 'grok-4.3'],
    ]);
    $run->load('productionSpec');

    $built = app(StageAgentService::class)->generate(
        $run,
        ProductionStage::Script,
        ArtifactKind::Script,
    );

    expect($built['payload']['title'] ?? null)->toBe('Ngjyrat')
        ->and($built['meta']['agent'])->toBe('laravel_ai')
        ->and($built['meta']['provider'])->toBe('xai')
        ->and($built['meta']['model'])->toBe('grok-4.3');
});

test('imagine master accepts model from request', function (): void {
    Config::set('services.xai.api_key', null);
    Config::set('ai.providers.xai.key', null);

    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'started_by' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('studio.runs.imagine-master', $run), [
            'duration' => 3,
            'model' => 'grok-imagine-video',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors('imagine');
});
