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
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    $this->actingAs($editor)
        ->get(route('studio.agents.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/agents/index')
            ->has('profiles')
            ->where('xaiConfigured', false));
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
            ->where('run.id', $run->id));
});
