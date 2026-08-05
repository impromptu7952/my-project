<?php

declare(strict_types=1);

use App\Actions\Production\ApproveProductionStage;
use App\Actions\Production\PublishEpisode;
use App\Actions\Production\RejectProductionRun;
use App\Actions\Production\StartProductionRun;
use App\Enums\ArtifactKind;
use App\Enums\EpisodeStatus;
use App\Enums\ProductionGate;
use App\Enums\ProductionRunStatus;
use App\Jobs\Production\CurriculumAgentJob;
use App\Models\Episode;
use App\Models\MediaAsset;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function (): void {
    Config::set('features.studio', true);
    $this->seed(ContentSeeder::class);
    RateLimiter::clear('production-start:'.User::query()->where('email', 'editor@playzone.test')->value('id'));
});

test('start production run creates running chain a and dispatches jobs', function (): void {
    Queue::fake();

    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'kafshet-pilot-v1')->firstOrFail();

    $run = app(StartProductionRun::class)->handle($spec, $editor);

    expect($run->status)->toBe(ProductionRunStatus::RunningChainA);

    Queue::assertPushed(CurriculumAgentJob::class);
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

test('double approve script is rejected', function (): void {
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::factory()->create(['created_by' => $editor->id]);
    $run = app(StartProductionRun::class)->handle($spec, $editor);
    $run->update(['status' => ProductionRunStatus::AwaitingScriptReview]);
    app(ApproveProductionStage::class)->handle($run, ProductionGate::Script, $editor);

    expect(fn () => app(ApproveProductionStage::class)->handle($run->fresh(), ProductionGate::Script, $editor))
        ->toThrow(HttpException::class);
});

test('reject is terminal', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingScriptReview,
        'started_by' => $editor->id,
    ]);

    $run = app(RejectProductionRun::class)->handle($run, $editor, 'nope');

    expect($run->status)->toBe(ProductionRunStatus::Rejected);
});

test('publish episode requires self hosted video master', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $episode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->firstOrFail();

    $published = app(PublishEpisode::class)->handle($episode, null, $editor);

    expect($published->status->value)->toBe('published');
});

test('publish without video master fails', function (): void {
    $episode = Episode::factory()->create([
        'status' => EpisodeStatus::Draft,
        'slug' => 'no-media-ep',
    ]);

    expect(fn () => app(PublishEpisode::class)->handle($episode))
        ->toThrow(HttpException::class);
});

test('publish with unapproved run fails', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $episode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingFinalReview,
        'started_by' => $editor->id,
    ]);

    expect(fn () => app(PublishEpisode::class)->handle($episode, $run, $editor))
        ->toThrow(HttpException::class);
});

test('publish rejects episode that does not match run spec', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $episode = Episode::query()->where('slug', 'kafshet-qeni-dhe-macja')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'ngjyrat-pilot-v1')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'production_spec_id' => $spec->id,
        'status' => ProductionRunStatus::Approved,
        'started_by' => $editor->id,
    ]);

    expect(fn () => app(PublishEpisode::class)->handle($episode, $run, $editor))
        ->toThrow(HttpException::class);
});

test('global open run limit is enforced', function (): void {
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();

    for ($i = 0; $i < 3; $i++) {
        $spec = ProductionSpec::factory()->create(['created_by' => $editor->id, 'slug' => "limit-spec-{$i}"]);
        app(StartProductionRun::class)->handle($spec, $editor);
        RateLimiter::clear('production-start:'.$editor->id);
    }

    $blocked = ProductionSpec::factory()->create(['created_by' => $editor->id, 'slug' => 'limit-spec-4']);

    expect(fn () => app(StartProductionRun::class)->handle($blocked, $editor))
        ->toThrow(HttpException::class);
});

test('per spec open run limit is enforced', function (): void {
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::factory()->create(['created_by' => $editor->id]);

    app(StartProductionRun::class)->handle($spec, $editor);
    RateLimiter::clear('production-start:'.$editor->id);

    expect(fn () => app(StartProductionRun::class)->handle($spec, $editor))
        ->toThrow(HttpException::class);
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

test('final approve blocked when quality report failed', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingFinalReview,
        'started_by' => $editor->id,
    ]);

    $run->artifacts()->create([
        'kind' => ArtifactKind::QualityReport,
        'stage' => 'quality',
        'version' => 1,
        'payload' => ['passed' => false, 'checks' => []],
    ]);

    expect(fn () => app(ApproveProductionStage::class)->handle($run, ProductionGate::Final, $editor))
        ->toThrow(HttpException::class);
});

test('final approve with quality override requires reason and records meta', function (): void {
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $run = ProductionRun::factory()->create([
        'status' => ProductionRunStatus::AwaitingFinalReview,
        'started_by' => $editor->id,
    ]);

    $run->artifacts()->create([
        'kind' => ArtifactKind::QualityReport,
        'stage' => 'quality',
        'version' => 1,
        'payload' => ['passed' => false, 'checks' => []],
    ]);

    expect(fn () => app(ApproveProductionStage::class)->handle(
        $run,
        ProductionGate::Final,
        $editor,
        forceQualityOverride: true,
        overrideReason: null,
    ))->toThrow(HttpException::class);

    $approved = app(ApproveProductionStage::class)->handle(
        $run,
        ProductionGate::Final,
        $editor,
        forceQualityOverride: true,
        overrideReason: 'Pedagogy lead signed off on pause length.',
    );

    expect($approved->status)->toBe(ProductionRunStatus::Approved)
        ->and($approved->meta['quality_override']['reason'] ?? null)
        ->toBe('Pedagogy lead signed off on pause length.')
        ->and($approved->meta['quality_override']['by'] ?? null)
        ->toBe($editor->id);
});

test('draft media is not world readable via publicUrl', function (): void {
    $episode = Episode::factory()->create([
        'status' => EpisodeStatus::Draft,
        'slug' => 'draft-media',
    ]);

    $asset = MediaAsset::factory()->create([
        'episode_id' => $episode->id,
        'disk' => 'local',
        'path' => 'episodes/secret/video_master.mp4',
    ]);

    expect($asset->publicUrl())->toBeNull();
});
