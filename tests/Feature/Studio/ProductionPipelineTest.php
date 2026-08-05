<?php

declare(strict_types=1);

use App\Actions\Production\ApproveProductionStage;
use App\Actions\Production\PublishEpisode;
use App\Actions\Production\StartProductionRun;
use App\Enums\ArtifactKind;
use App\Enums\ProductionGate;
use App\Enums\ProductionRunStatus;
use App\Models\Episode;
use App\Models\ProductionSpec;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

test('start production run creates running chain a and dispatches jobs', function (): void {
    Queue::fake();

    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'kafshet-pilot-v1')->firstOrFail();

    $run = app(StartProductionRun::class)->handle($spec, $editor);

    expect($run->status)->toBe(ProductionRunStatus::RunningChainA);

    Queue::assertPushed(App\Jobs\Production\CurriculumAgentJob::class);
});

test('approve script gate transitions to chain b', function (): void {
    Queue::fake();

    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::factory()->create(['created_by' => $editor->id]);

    $run = app(StartProductionRun::class)->handle($spec, $editor);
    $run->update(['status' => ProductionRunStatus::AwaitingScriptReview]);

    $run = app(ApproveProductionStage::class)->handle($run, ProductionGate::Script, $editor);

    expect($run->status)->toBe(ProductionRunStatus::RunningChainB);
    expect($run->script_approved_by)->toBe($editor->id);
});

test('publish episode requires self hosted video master', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $episode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->firstOrFail();

    $published = app(PublishEpisode::class)->handle($episode, null, $editor);

    expect($published->status->value)->toBe('published');
});

test('seeded ngjyrat package has albanian script artifact', function (): void {
    $spec = ProductionSpec::query()->where('slug', 'ngjyrat-pilot-v1')->firstOrFail();
    $run = $spec->runs()->where('status', ProductionRunStatus::Approved)->first();

    expect($run)->not->toBeNull();

    $script = $run->artifacts()->where('kind', ArtifactKind::Script)->first();
    expect($script)->not->toBeNull();
    expect(json_encode($script->payload))->toContain('E kuqe');
    expect(json_encode($script->payload))->toContain('topi i kuq');
});
