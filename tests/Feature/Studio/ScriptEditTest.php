<?php

declare(strict_types=1);

use App\Actions\Production\StartProductionRun;
use App\Actions\Production\UpdateArtifactPayload;
use App\Enums\ArtifactKind;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
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

function seedScriptRun(): array
{
    Queue::fake();
    $editor = User::query()->where('email', 'editor@playzone.test')->firstOrFail();
    $spec = ProductionSpec::query()->where('slug', 'ngjyrat-pilot-v1')->firstOrFail();
    $run = app(StartProductionRun::class)->handle($spec, $editor);
    $run->update(['status' => ProductionRunStatus::AwaitingScriptReview]);

    $run->artifacts()->create([
        'kind' => ArtifactKind::Script,
        'stage' => ProductionStage::Script,
        'version' => 1,
        'payload' => [
            'title' => 'Original title',
            'character' => ['name' => 'Lumi'],
            'sections' => [
                [
                    'id' => 'hello',
                    'name' => 'Open',
                    'duration_seconds' => 20,
                    'dialogue' => ['Përshëndetje!', 'E kuqe.'],
                    'pause_seconds' => 3,
                ],
            ],
        ],
        'meta' => [],
    ]);

    return [$editor, $run->fresh(['artifacts'])];
}

test('manual script edit creates new version with updated dialogue', function (): void {
    [$editor, $run] = seedScriptRun();

    $payload = [
        'title' => 'Edited title',
        'character' => ['name' => 'Lumi'],
        'sections' => [
            [
                'id' => 'hello',
                'name' => 'Open',
                'duration_seconds' => 25,
                'dialogue' => ['Përshëndetje, miq!', 'E kuqe.', 'Shumë mirë!'],
                'pause_seconds' => 4,
            ],
        ],
    ];

    $artifact = app(UpdateArtifactPayload::class)->handle(
        $run,
        ArtifactKind::Script,
        $payload,
        $editor,
    );

    expect($artifact->version)->toBe(2)
        ->and($artifact->payload['title'])->toBe('Edited title')
        ->and($artifact->payload['sections'][0]['dialogue'])->toHaveCount(3)
        ->and($artifact->payload['sections'][0]['dialogue'][2])->toBe('Shumë mirë!')
        ->and($artifact->meta['source'] ?? null)->toBe('manual_edit');
});

test('editor can save script via studio artifacts route', function (): void {
    [$editor, $run] = seedScriptRun();

    $payload = [
        'title' => 'HTTP edited',
        'sections' => [
            [
                'id' => 's1',
                'name' => 'Body',
                'duration_seconds' => 40,
                'dialogue' => ['Line one', 'Line two added'],
                'pause_seconds' => 5,
            ],
            [
                'id' => 's2',
                'name' => 'Close',
                'duration_seconds' => 15,
                'dialogue' => ['Mirupafshim!'],
                'pause_seconds' => 2,
            ],
        ],
    ];

    $this->actingAs($editor)
        ->post(route('studio.runs.artifacts.update', $run), [
            'kind' => 'script',
            'payload' => $payload,
        ])
        ->assertRedirect(route('studio.runs.show', $run));

    $latest = $run->latestArtifact(ArtifactKind::Script->value);
    expect($latest)->not->toBeNull()
        ->and($latest?->version)->toBe(2)
        ->and($latest?->payload['title'])->toBe('HTTP edited')
        ->and($latest?->payload['sections'])->toHaveCount(2)
        ->and($latest?->payload['sections'][0]['dialogue'])->toContain('Line two added');
});

test('script edit blocked while chain is running', function (): void {
    [$editor, $run] = seedScriptRun();
    $run->update(['status' => ProductionRunStatus::RunningChainB]);

    $this->actingAs($editor)
        ->post(route('studio.runs.artifacts.update', $run), [
            'kind' => 'script',
            'payload' => ['title' => 'Nope', 'sections' => []],
        ])
        ->assertStatus(422);
});

test('run workspace exposes script artifact for editor', function (): void {
    [$editor, $run] = seedScriptRun();

    $this->actingAs($editor)
        ->get(route('studio.runs.show', $run))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('studio/runs/show')
            ->has('run.latestByKind.script')
            ->where('run.latestByKind.script.payload.title', 'Original title')
            ->where('run.latestByKind.script.payload.sections.0.dialogue.0', 'Përshëndetje!'));
});

test('adding a section via save persists new section structure', function (): void {
    [$editor, $run] = seedScriptRun();

    $payload = [
        'title' => 'With new section',
        'sections' => [
            [
                'id' => 'hello',
                'name' => 'Open',
                'duration_seconds' => 20,
                'dialogue' => ['Përshëndetje!'],
                'pause_seconds' => 3,
            ],
            [
                'id' => 'section_new',
                'name' => 'New section',
                'duration_seconds' => 30,
                'dialogue' => [''],
                'pause_seconds' => 3,
            ],
        ],
    ];

    $this->actingAs($editor)
        ->post(route('studio.runs.artifacts.update', $run), [
            'kind' => 'script',
            'payload' => $payload,
        ])
        ->assertRedirect();

    $latest = $run->fresh()->latestArtifact(ArtifactKind::Script->value);
    expect($latest?->payload['sections'])->toHaveCount(2)
        ->and($latest?->payload['sections'][1]['name'])->toBe('New section');
});
