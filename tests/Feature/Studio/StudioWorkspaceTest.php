<?php

declare(strict_types=1);

use App\Actions\Production\CloneProductionRun;
use App\Actions\Production\RegenerateStage;
use App\Actions\Production\StartProductionRun;
use App\Actions\Production\UpdateArtifactPayload;
use App\Enums\ArtifactKind;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Jobs\Production\ScriptAgentJob;
use App\Models\AgentProfile;
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

test('editor can open agent profiles index', function (): void {
    Config::set('services.xai.api_key', null);
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.agents.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/agents/index')
            ->has('profiles')
            ->where('xaiConfigured', false));
});

test('agents index reports xai configured when api key is set', function (): void {
    Config::set('services.xai.api_key', 'test-key-not-used-for-http');
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.agents.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/agents/index')
            ->where('xaiConfigured', true));
});

test('manual artifact edit creates a new version', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingScriptReview,
        'started_by' => $editor->id,
    ]);

    $run->artifacts()->create([
        'kind' => ArtifactKind::Script,
        'stage' => ProductionStage::Script,
        'version' => 1,
        'payload' => ['title' => 'v1'],
        'meta' => [],
    ]);

    $artifact = app(UpdateArtifactPayload::class)->handle(
        $run,
        ArtifactKind::Script,
        ['title' => 'edited by human', 'sections' => []],
        $editor,
    );

    expect($artifact->version)->toBe(2)
        ->and($artifact->payload['title'])->toBe('edited by human')
        ->and($artifact->meta['source'] ?? null)->toBe('manual_edit');
});

test('regenerate stage dispatches single stage job', function (): void {
    Queue::fake();

    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingScriptReview,
        'started_by' => $editor->id,
    ]);

    $profile = AgentProfile::query()->where('stage', ProductionStage::Script)->firstOrFail();

    app(RegenerateStage::class)->handle($run, ProductionStage::Script, $editor, $profile->id);

    $run->refresh();
    expect($run->meta['allow_stage_write'] ?? false)->toBeTrue()
        ->and($run->agent_profile_map[ProductionStage::Script->value] ?? null)->toBe($profile->id);

    Queue::assertPushed(ScriptAgentJob::class);
});

test('clone production run copies latest artifacts', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::Approved,
        'started_by' => $editor->id,
    ]);
    $run->artifacts()->create([
        'kind' => ArtifactKind::Script,
        'stage' => ProductionStage::Script,
        'version' => 2,
        'payload' => ['title' => 'source script'],
        'meta' => [],
    ]);
    $run->artifacts()->create([
        'kind' => ArtifactKind::Script,
        'stage' => ProductionStage::Script,
        'version' => 1,
        'payload' => ['title' => 'old'],
        'meta' => [],
    ]);

    $clone = app(CloneProductionRun::class)->handle($run, $editor);

    expect($clone->id)->not->toBe($run->id)
        ->and($clone->status)->toBe(ProductionRunStatus::AwaitingScriptReview)
        ->and($clone->artifacts)->toHaveCount(1)
        ->and($clone->artifacts->first()?->payload['title'] ?? null)->toBe('source script')
        ->and($clone->meta['cloned_from_run_id'] ?? null)->toBe($run->id);
});

test('run workspace page includes steps and agent profiles', function (): void {
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'ngjyrat-pilot-v1')->firstOrFail();
    $run = app(StartProductionRun::class)->handle($spec, $editor);
    $run->update(['status' => ProductionRunStatus::AwaitingScriptReview]);

    $this->actingAs($editor)
        ->get(route('studio.runs.show', $run))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/runs/show')
            ->has('steps')
            ->has('agentProfilesByStage')
            ->where('run.id', $run->id)
            ->has('episodePreview')
            ->where('episodePreview.slug', 'ngjyrat-kuq-kalter-verdh-gjelber')
            ->where('episodePreview.playback.hasVideo', true)
            ->has('episodePreview.playback.src'));
});

test('studio playback resolves masters for draft and published episodes', function (): void {
    $episode = \App\Models\Episode::query()
        ->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')
        ->with('mediaAssets')
        ->firstOrFail();

    $playback = app(\App\Actions\Media\ResolveStudioPlayback::class)->handle($episode);

    expect($playback['hasVideo'])->toBeTrue()
        ->and($playback['src'])->toBeString()
        ->and($playback['src'])->toContain('/storage/');
});

test('editor can save stage notes on a run', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingScriptReview,
        'started_by' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('studio.runs.notes', $run), [
            'stage' => ProductionStage::Script->value,
            'notes' => 'Slow down the red ball beat.',
        ])
        ->assertRedirect();

    $run->refresh();
    expect($run->meta['stage_notes']['script']['notes'] ?? null)
        ->toBe('Slow down the red ball beat.')
        ->and($run->meta['stage_notes']['script']['updated_by'] ?? null)
        ->toBe($editor->id);
});

test('editor can build voice preview package from vo script', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingFinalReview,
        'started_by' => $editor->id,
    ]);

    $run->artifacts()->create([
        'kind' => ArtifactKind::VoScript,
        'stage' => ProductionStage::Voice,
        'version' => 1,
        'payload' => [
            'vo_script' => [
                ['section_id' => 'open', 'line' => 'Përshëndetje!', 'pause_after_seconds' => 2],
                ['section_id' => 'body', 'line' => 'Ku është topi i kuq?', 'pause_after_seconds' => 3],
            ],
        ],
        'meta' => [],
    ]);

    $this->actingAs($editor)
        ->post(route('studio.runs.preview-voice', $run))
        ->assertRedirect();

    $run->refresh();
    expect($run->meta['tts_preview']['stored_previews'] ?? 0)->toBe(2)
        ->and($run->meta['tts_preview']['cues'] ?? [])->toHaveCount(2)
        ->and($run->meta['tts_preview']['provider'] ?? null)->toBe('null');
});

test('brand bible page renders character kit', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.brand'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/brand')
            ->has('character')
            ->where('character.name', 'Lumi'));
});

test('editor can export production run package as json', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingScriptReview,
        'started_by' => $editor->id,
    ]);
    $run->artifacts()->create([
        'kind' => ArtifactKind::Script,
        'stage' => ProductionStage::Script,
        'version' => 1,
        'payload' => ['title' => 'Export me', 'sections' => []],
        'meta' => [],
    ]);

    $response = $this->actingAs($editor)
        ->get(route('studio.runs.export', $run));

    $response->assertOk();
    $response->assertHeader('content-disposition');

    $data = json_decode($response->streamedContent(), true);
    expect($data['run']['id'] ?? null)->toBe($run->id)
        ->and($data['character_bible']['name'] ?? null)->toBe('Lumi')
        ->and($data['artifacts'][0]['kind'] ?? null)->toBe('script')
        ->and($data['artifacts'][0]['payload']['title'] ?? null)->toBe('Export me');
});

test('editor can build visual preview package from image prompts', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingFinalReview,
        'started_by' => $editor->id,
    ]);

    $run->artifacts()->create([
        'kind' => ArtifactKind::ImagePrompts,
        'stage' => ProductionStage::VisualPrompts,
        'version' => 1,
        'payload' => [
            'image_prompts' => [
                ['shot_id' => 's1', 'prompt' => 'Lumi holds a red ball, soft 3D, sunny'],
                ['shot_id' => 's2', 'prompt' => 'Lumi waves hello, sky blue sweater'],
            ],
        ],
        'meta' => [],
    ]);

    $this->actingAs($editor)
        ->post(route('studio.runs.preview-visual', $run))
        ->assertRedirect();

    $run->refresh();
    expect($run->meta['visual_preview']['stored_previews'] ?? 0)->toBe(2)
        ->and($run->meta['visual_preview']['provider'] ?? null)->toBe('null');
});
