<?php

declare(strict_types=1);

namespace App\Services\Production;

use App\Enums\ArtifactKind;
use App\Enums\ProductionStage;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;

/**
 * Deterministic stub agent used when XAI_API_KEY is absent (tests + local pilot).
 */
final class StubProductionAgent
{
    /**
     * @return array{payload: array<string, mixed>, meta: array<string, mixed>}
     */
    public function generate(ProductionRun $run, ProductionStage $stage, ArtifactKind $kind): array
    {
        $spec = $run->productionSpec?->spec ?? [];
        $slug = $spec['episode_slug'] ?? $run->productionSpec?->episode_slug ?? 'episode';
        $title = $run->productionSpec?->title ?? 'Episode';

        $payload = match ($kind) {
            ArtifactKind::Curriculum => [
                'episode_slug' => $slug,
                'learning_goals' => $spec['learning_goals'] ?? ['colors'],
                'skills' => ['language', 'colors', 'attention'],
                'age_band' => $spec['age_band'] ?? '1-3',
                'notes' => 'Curriculum package for co-viewing ages 1–3 (standard literary Albanian).',
            ],
            ArtifactKind::Script => $this->scriptFor($title, $slug, $spec),
            ArtifactKind::Storyboard => [
                'shots' => [
                    ['id' => 1, 'scene' => 'Hyrje', 'visual' => 'Karakteri i animuar përshëndet fëmijët', 'duration' => 30],
                    ['id' => 2, 'scene' => 'Ngjyrat', 'visual' => 'Topa me ngjyra: kuq, kaltër, verdhë, gjelbër', 'duration' => 180],
                    ['id' => 3, 'scene' => 'Ndërveprim', 'visual' => 'Pauzë: Ku është topi i kuq?', 'duration' => 60],
                    ['id' => 4, 'scene' => 'Mbyllje', 'visual' => 'Kënga e lamtumirës', 'duration' => 45],
                ],
            ],
            ArtifactKind::ShotList => [
                'shots' => ['WS_intro', 'CU_red_ball', 'CU_blue_ball', 'CU_yellow_ball', 'CU_green_ball', 'WS_goodbye'],
            ],
            ArtifactKind::ImagePrompts => [
                'character' => 'Stylized friendly animated toddler mascot, soft shapes, bright colors, safe for ages 1-3',
                'scenes' => ['red ball on soft rug', 'blue balloon floating', 'yellow sun shape', 'green leaf'],
            ],
            ArtifactKind::VideoPrompts => [
                'style' => '2D stylized animation, gentle camera, slow motion',
                'clips' => ['hello song loop', 'color reveal transitions', 'interactive pause hold'],
            ],
            ArtifactKind::ThumbnailConcept => [
                'text_sq' => 'Ngjyrat!',
                'visual' => 'Four bright color balls with smiling mascot',
            ],
            ArtifactKind::VoScript => [
                'language' => 'sq',
                'lines' => [
                    'Përshëndetje, miq të vegjël!',
                    'Sot mësojmë ngjyrat.',
                    'E kuqe. E kaltër. E verdhë. E gjelbër.',
                    'Mirupafshim!',
                ],
            ],
            ArtifactKind::TtsManifest => [
                'provider' => 'null',
                'locale' => 'sq',
                'segments' => [],
            ],
            ArtifactKind::EditInstructions => [
                'format' => 'mp4',
                'target_duration_seconds' => 720,
                'notes' => 'Hold 3–5s after interactive questions. Soft fade between color scenes.',
            ],
            ArtifactKind::OnScreenText => [
                'labels' => [
                    ['text' => 'E kuqe', 'timecode' => '00:01:00'],
                    ['text' => 'E kaltër', 'timecode' => '00:02:00'],
                    ['text' => 'E verdhë', 'timecode' => '00:03:00'],
                    ['text' => 'E gjelbër', 'timecode' => '00:04:00'],
                ],
            ],
            ArtifactKind::SubtitlesVtt => [
                'language' => 'sq',
                'vtt' => "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nPërshëndetje, miq të vegjël!\n\n00:00:05.000 --> 00:00:10.000\nSot mësojmë ngjyrat.\n",
            ],
            ArtifactKind::QualityReport => [
                'assistant' => 'stub',
                'summary' => 'Package ready for human final review.',
            ],
            ArtifactKind::VisualApproval => [
                'approved' => false,
                'notes' => 'Awaiting human visual approval before master assembly.',
            ],
        };

        return [
            'payload' => $payload,
            'meta' => [
                'agent' => 'stub',
                'stage' => $stage->value,
                'kind' => $kind->value,
            ],
        ];
    }

    public function writeArtifact(ProductionRun $run, ProductionStage $stage, ArtifactKind $kind, int $version = 1): ProductionArtifact
    {
        $generated = $this->generate($run, $stage, $kind);

        return ProductionArtifact::query()->updateOrCreate(
            [
                'production_run_id' => $run->id,
                'kind' => $kind->value,
                'version' => $version,
            ],
            [
                'stage' => $stage->value,
                'payload' => $generated['payload'],
                'meta' => $generated['meta'],
            ]
        );
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * @param  array<string, mixed>  $spec
     * @return array<string, mixed>
     */
    private function scriptFor(string $title, string $slug, array $spec): array
    {
        if (str_contains($slug, 'ngjyrat') || str_contains($slug, 'color')) {
            return $this->ngjyratScript($title, $slug);
        }

        if (str_contains($slug, 'kafsh') || str_contains($slug, 'animal')) {
            return $this->animalsScript($title, $slug);
        }

        if (str_contains($slug, 'pershendet') || str_contains($slug, 'greeting')) {
            return $this->greetingsScript($title, $slug);
        }

        return $this->genericScript($title, $slug, $spec);
    }

    /**
     * @param  array<string, mixed>  $spec
     * @return array<string, mixed>
     */
    private function genericScript(string $title, string $slug, array $spec): array
    {
        $vocab = is_array($spec['vocabulary'] ?? null) ? $spec['vocabulary'] : [];
        $words = [];
        foreach ($vocab as $item) {
            if (is_array($item) && isset($item['word'])) {
                $words[] = (string) $item['word'];
            }
        }
        $wordLine = $words !== [] ? implode('. ', $words).'.' : 'Fjalë të reja.';

        return [
            'title' => $title,
            'episode_slug' => $slug,
            'language' => 'sq',
            'dialect' => 'standard_literary_albanian',
            'duration_target_seconds' => 300,
            'sections' => [
                [
                    'id' => 'hello',
                    'name' => 'Përshëndetje',
                    'dialogue' => [
                        'Karakteri: Përshëndetje, miq të vegjël!',
                        'Karakteri: '.$wordLine,
                        'Karakteri: Mirupafshim!',
                    ],
                    'pause_seconds' => 4,
                ],
            ],
            'principles' => [
                'phrase_length' => '2-6 words',
                'interactive_pauses_seconds' => '3-5',
                'co_viewing' => true,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function animalsScript(string $title, string $slug): array
    {
        return [
            'title' => $title,
            'episode_slug' => $slug,
            'language' => 'sq',
            'dialect' => 'standard_literary_albanian',
            'duration_target_seconds' => 180,
            'sections' => [
                [
                    'id' => 'hello',
                    'name' => 'Përshëndetje',
                    'dialogue' => ['Karakteri: Përshëndetje! Sot shohim kafshë.'],
                    'pause_seconds' => 3,
                ],
                [
                    'id' => 'animals',
                    'name' => 'Qeni dhe macja',
                    'dialogue' => [
                        'Karakteri: Ja qeni — ham ham!',
                        'Karakteri: Ja macja — miau!',
                        '[PAUZË 4 sekonda]',
                        'Karakteri: Shumë mirë!',
                    ],
                    'pause_seconds' => 4,
                ],
                [
                    'id' => 'goodbye',
                    'name' => 'Mirupafshim',
                    'dialogue' => ['Karakteri: Mirupafshim, kafshë të dashura!'],
                    'pause_seconds' => 3,
                ],
            ],
            'principles' => ['phrase_length' => '2-6 words', 'co_viewing' => true],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function greetingsScript(string $title, string $slug): array
    {
        return [
            'title' => $title,
            'episode_slug' => $slug,
            'language' => 'sq',
            'dialect' => 'standard_literary_albanian',
            'duration_target_seconds' => 120,
            'sections' => [
                [
                    'id' => 'greetings',
                    'name' => 'Mirëmëngjesi',
                    'dialogue' => [
                        'Karakteri: Mirëmëngjesi!',
                        'Karakteri: Përshëndetje, miq!',
                        'Karakteri: Faleminderit! Mirupafshim!',
                    ],
                    'pause_seconds' => 3,
                ],
            ],
            'principles' => ['phrase_length' => '2-6 words', 'co_viewing' => true],
        ];
    }

    private function ngjyratScript(string $title, string $slug): array
    {
        return [
            'title' => $title,
            'episode_slug' => $slug,
            'language' => 'sq',
            'dialect' => 'standard_literary_albanian',
            'duration_target_seconds' => 720,
            'sections' => [
                [
                    'id' => 'hello_song',
                    'name' => 'Kënga e përshëndetjes',
                    'duration_seconds' => 60,
                    'dialogue' => [
                        'Karakteri: Përshëndetje, miq të vegjël! Unë jam Lumi.',
                        'Karakteri: (këndon) Mirëmëngjesi, mirëmëngjesi, si jeni sot?',
                        'Karakteri: Ejani të luajmë bashkë!',
                    ],
                    'pause_seconds' => 3,
                ],
                [
                    'id' => 'colors_intro',
                    'name' => 'Katër ngjyrat',
                    'duration_seconds' => 240,
                    'dialogue' => [
                        'Karakteri: Sot mësojmë katër ngjyra.',
                        'Karakteri: E kuqe! Shiko topin e kuq.',
                        'Karakteri: E kaltër! Si qielli.',
                        'Karakteri: E verdhë! Si dielli.',
                        'Karakteri: E gjelbër! Si bari.',
                    ],
                    'vocabulary' => [
                        ['sq' => 'E kuqe', 'en' => 'Red'],
                        ['sq' => 'E kaltër', 'en' => 'Blue'],
                        ['sq' => 'E verdhë', 'en' => 'Yellow'],
                        ['sq' => 'E gjelbër', 'en' => 'Green'],
                    ],
                    'pause_seconds' => 4,
                ],
                [
                    'id' => 'interactive',
                    'name' => 'Ku është topi i kuq?',
                    'duration_seconds' => 180,
                    'dialogue' => [
                        'Karakteri: Tani… ku është topi i kuq?',
                        '[PAUZË 5 sekonda – prindi ndihmon fëmijën]',
                        'Karakteri: Po! Topi i kuq! Shumë mirë!',
                        'Karakteri: Ku është topi i kaltër?',
                        '[PAUZË 5 sekonda]',
                        'Karakteri: Po! E kaltër! Bravo!',
                        'Karakteri: Ku është topi i verdhë?',
                        '[PAUZË 5 sekonda]',
                        'Karakteri: Po! E verdhë!',
                        'Karakteri: Dhe topi i gjelbër?',
                        '[PAUZË 5 sekonda]',
                        'Karakteri: Po! E gjelbër! Shumë mirë!',
                    ],
                    'pause_seconds' => 5,
                ],
                [
                    'id' => 'goodbye_song',
                    'name' => 'Kënga e lamtumirës',
                    'duration_seconds' => 60,
                    'dialogue' => [
                        'Karakteri: (këndon) Mirupafshim, mirupafshim, luajmë prapë!',
                        'Karakteri: Faleminderit që luajtët me mua. Unë ju dua!',
                        'Karakteri: Mirupafshim!',
                    ],
                    'pause_seconds' => 3,
                ],
            ],
            'principles' => [
                'phrase_length' => '2-6 words',
                'interactive_pauses_seconds' => '3-5',
                'co_viewing' => true,
            ],
        ];
    }
}
