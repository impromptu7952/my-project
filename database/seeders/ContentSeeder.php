<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AgeBand;
use App\Enums\ArtifactKind;
use App\Enums\EpisodeStatus;
use App\Enums\MediaKind;
use App\Enums\MediaProvider;
use App\Enums\ProductionRunStatus;
use App\Enums\ProductionStage;
use App\Models\CurriculumLink;
use App\Models\Episode;
use App\Models\Game;
use App\Models\MediaAsset;
use App\Models\ProductionArtifact;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use App\Models\Series;
use App\Models\Topic;
use App\Models\User;
use App\Services\Production\StubProductionAgent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

final class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedEditor();
        $this->seedTopicsAndSeries();
        $this->seedGames();
        $this->seedEpisodesAndMedia();
        $this->seedCurriculumLinks();
        $this->seedProduction();
    }

    private function seedEditor(): void
    {
        $editor = User::query()->updateOrCreate(
            ['email' => 'editor@playzone.test'],
            [
                'name' => 'PlayZone Editor',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $editor->forceFill(['is_editor' => true])->save();

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
    }

    private function seedTopicsAndSeries(): void
    {
        $topics = [
            [
                'slug' => 'ngjyrat',
                'name_sq' => 'Ngjyrat',
                'name_en' => 'Colors',
                'description_sq' => 'Mësojmë ngjyrat bazë me këngë dhe lojëra.',
                'description_en' => 'Learn basic colors with songs and play.',
                'skills' => ['colors', 'language', 'attention'],
                'sort_order' => 1,
            ],
            [
                'slug' => 'kafshet',
                'name_sq' => 'Kafshët',
                'name_en' => 'Animals',
                'description_sq' => 'Kafshë të dashura dhe tingujt e tyre.',
                'description_en' => 'Friendly animals and their sounds.',
                'skills' => ['language', 'animals', 'music'],
                'sort_order' => 2,
            ],
            [
                'slug' => 'pjeset-e-trupit',
                'name_sq' => 'Pjesët e trupit',
                'name_en' => 'Body parts',
                'description_sq' => 'Emërtojmë pjesët e trupit me lëvizje.',
                'description_en' => 'Name body parts with movement.',
                'skills' => ['body_parts', 'motor', 'language'],
                'sort_order' => 3,
            ],
            [
                'slug' => 'pershendetjet',
                'name_sq' => 'Përshëndetjet',
                'name_en' => 'Greetings',
                'description_sq' => 'Mirëmëngjesi, mirupafshim dhe fjalë të ngrohta.',
                'description_en' => 'Hello, goodbye, and warm everyday words.',
                'skills' => ['language', 'social'],
                'sort_order' => 4,
            ],
            [
                'slug' => 'fjalet-e-para',
                'name_sq' => 'Fjalët e para',
                'name_en' => 'First words',
                'description_sq' => 'Fjalë të shkurtra për fëmijët e vegjël.',
                'description_en' => 'Short first words for little ones.',
                'skills' => ['language', 'attention'],
                'sort_order' => 5,
            ],
        ];

        foreach ($topics as $topicData) {
            $topic = Topic::query()->updateOrCreate(
                ['slug' => $topicData['slug']],
                [
                    ...$topicData,
                    'age_band' => AgeBand::OneToThree,
                ]
            );

            Series::query()->updateOrCreate(
                ['slug' => $topicData['slug'].'-seria-1'],
                [
                    'topic_id' => $topic->id,
                    'title_sq' => $topicData['name_sq'].' — Seria 1',
                    'title_en' => $topicData['name_en'].' — Series 1',
                    'sort_order' => 1,
                ]
            );
        }
    }

    private function seedGames(): void
    {
        $games = [
            [
                'slug' => 'touch-and-tap',
                'route_name' => 'games.touch-and-tap',
                'name_sq' => 'Prek & Trokit',
                'name_en' => 'Touch & Tap',
                'description_sq' => 'Prek ekranin — shfaqen forma dhe tinguj! Për moshën 1–2 vjeç.',
                'description_en' => 'Tap the screen — shapes and sounds appear! Ages 1–2.',
                'age_band' => AgeBand::OneToTwo,
                'emoji' => '👆',
                'badge_sq' => '1–2 vjeç · me prind',
                'badge_en' => '1–2 · with grown-up',
                'gradient' => 'from-amber-300 to-orange-500',
                'featured_for_toddlers' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'color-pop',
                'route_name' => 'games.color-pop',
                'name_sq' => 'Shpërthimi i Ngjyrave',
                'name_en' => 'Color Pop',
                'description_sq' => 'Shpërthe balonat e ngjyrës së duhur! Për moshën 2–3 vjeç.',
                'description_en' => 'Pop balloons that match the color! Ages 2–3.',
                'age_band' => AgeBand::TwoToThree,
                'emoji' => '🎈',
                'badge_sq' => '2–3 vjeç · me prind',
                'badge_en' => '2–3 · with grown-up',
                'gradient' => 'from-rose-400 to-pink-600',
                'featured_for_toddlers' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'memory',
                'route_name' => 'games.memory',
                'name_sq' => 'Loja e Memories',
                'name_en' => 'Memory Match',
                'description_sq' => 'Gjej çiftet e kartave!',
                'description_en' => 'Flip cards and find matching pairs!',
                'age_band' => AgeBand::ThreeToFive,
                'emoji' => '🧠',
                'badge_sq' => 'Memoria',
                'badge_en' => 'Memory',
                'gradient' => 'from-violet-400 to-purple-600',
                'featured_for_toddlers' => false,
                'sort_order' => 10,
            ],
            [
                'slug' => 'whack-a-mole',
                'route_name' => 'games.whack-a-mole',
                'name_sq' => 'Qëllo Urithin',
                'name_en' => 'Whack-a-Mole',
                'description_sq' => 'Prek urithët para se të fshihen!',
                'description_en' => 'Tap the moles before they hide!',
                'age_band' => AgeBand::ThreeToFive,
                'emoji' => '🐹',
                'badge_sq' => 'Reflekse',
                'badge_en' => 'Reflexes',
                'gradient' => 'from-emerald-400 to-green-600',
                'featured_for_toddlers' => false,
                'sort_order' => 11,
            ],
            [
                'slug' => 'tic-tac-toe',
                'route_name' => 'games.tic-tac-toe',
                'name_sq' => 'Tris',
                'name_en' => 'Tic-Tac-Toe',
                'description_sq' => 'Bëj tre në rresht!',
                'description_en' => 'Get three in a row!',
                'age_band' => AgeBand::FivePlus,
                'emoji' => '❌',
                'badge_sq' => 'Strategji',
                'badge_en' => 'Strategy',
                'gradient' => 'from-sky-400 to-blue-600',
                'featured_for_toddlers' => false,
                'sort_order' => 12,
            ],
            [
                'slug' => 'rock-paper-scissors',
                'route_name' => 'games.rock-paper-scissors',
                'name_sq' => 'Guri Letra Gërshëra',
                'name_en' => 'Rock Paper Scissors',
                'description_sq' => 'Sfido kompjuterin!',
                'description_en' => 'Challenge the computer!',
                'age_band' => AgeBand::FivePlus,
                'emoji' => '✂️',
                'badge_sq' => 'Klasike',
                'badge_en' => 'Classic',
                'gradient' => 'from-amber-400 to-orange-600',
                'featured_for_toddlers' => false,
                'sort_order' => 13,
            ],
            [
                'slug' => 'number-quest',
                'route_name' => 'games.number-quest',
                'name_sq' => 'Aventura e Numrave',
                'name_en' => 'Number Quest',
                'description_sq' => 'Gjej numrin sekret!',
                'description_en' => 'Guess the secret number!',
                'age_band' => AgeBand::FivePlus,
                'emoji' => '🔢',
                'badge_sq' => 'Matematikë',
                'badge_en' => 'Math fun',
                'gradient' => 'from-cyan-400 to-teal-600',
                'featured_for_toddlers' => false,
                'sort_order' => 14,
            ],
        ];

        foreach ($games as $game) {
            Game::query()->updateOrCreate(
                ['slug' => $game['slug']],
                [...$game, 'is_active' => true]
            );
        }
    }

    private function seedEpisodesAndMedia(): void
    {
        Storage::disk('public')->makeDirectory('episodes');

        $episodes = [
            [
                'topic' => 'ngjyrat',
                'slug' => 'ngjyrat-kuq-kalter-verdh-gjelber',
                'title_sq' => 'Ngjyrat: E kuqe, e kaltër, e verdhë, e gjelbër',
                'title_en' => 'Colors: Red, blue, yellow, green',
                'summary_sq' => 'Lumi këndon dhe tregon katër ngjyrat. Pastaj pyet: «Ku është topi i kuq?» — pauza për fëmijën. Ideal me prindin.',
                'summary_en' => 'Lumi sings and shows four colors, then asks “Where is the red ball?” with pauses for co-play.',
                'duration' => 180,
                'sort' => 1,
                'vtt' => "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nPërshëndetje, miq të vegjël!\n\n00:00:05.000 --> 00:00:10.000\nSot mësojmë ngjyrat: e kuqe, e kaltër, e verdhë, e gjelbër.\n\n00:00:12.000 --> 00:00:18.000\nKu është topi i kuq?\n\n00:00:20.000 --> 00:00:24.000\nShumë mirë! Mirupafshim!\n",
            ],
            [
                'topic' => 'kafshet',
                'slug' => 'kafshet-qeni-dhe-macja',
                'title_sq' => 'Kafshët: Qeni dhe macja',
                'title_en' => 'Animals: Dog and cat',
                'summary_sq' => 'Njihuni me qenin «ham ham» dhe macen «miau». Fjalë të shkurtra, tinguj të butë.',
                'summary_en' => 'Meet the dog “woof” and cat “meow”. Short words, gentle sounds.',
                'duration' => 120,
                'sort' => 2,
                'vtt' => "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nPërshëndetje!\n\n00:00:04.000 --> 00:00:08.000\nJa qeni — ham ham!\n\n00:00:09.000 --> 00:00:13.000\nJa macja — miau!\n\n00:00:14.000 --> 00:00:18.000\nMirupafshim, kafshë të dashura!\n",
            ],
            [
                'topic' => 'pershendetjet',
                'slug' => 'pershendetjet-miremengjesi',
                'title_sq' => 'Përshëndetjet: Mirëmëngjesi',
                'title_en' => 'Greetings: Good morning',
                'summary_sq' => 'Kënga e mirëmëngjesit dhe fjalët: përshëndetje, faleminderit, mirupafshim.',
                'summary_en' => 'A good-morning song and the words hello, thank you, goodbye.',
                'duration' => 90,
                'sort' => 3,
                'vtt' => "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nMirëmëngjesi!\n\n00:00:05.000 --> 00:00:09.000\nPërshëndetje, miq!\n\n00:00:10.000 --> 00:00:14.000\nFaleminderit! Mirupafshim!\n",
            ],
        ];

        foreach ($episodes as $data) {
            $series = Series::query()->where('slug', $data['topic'].'-seria-1')->firstOrFail();

            $episode = Episode::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'series_id' => $series->id,
                    'title_sq' => $data['title_sq'],
                    'title_en' => $data['title_en'],
                    'language' => 'sq',
                    'age_band' => AgeBand::OneToThree,
                    'status' => EpisodeStatus::Published,
                    'duration_seconds' => $data['duration'],
                    'episode_number' => 1,
                    'sort_order' => $data['sort'],
                    'summary_sq' => $data['summary_sq'],
                    'summary_en' => $data['summary_en'],
                    'published_at' => now(),
                    'skills' => ['language'],
                ]
            );

            $videoRel = 'episodes/'.$episode->slug.'/video_master.mp4';
            $vttRel = 'episodes/'.$episode->slug.'/subtitle.vtt';

            $this->ensureMp4(Storage::disk('public')->path($videoRel));
            Storage::disk('public')->put($vttRel, $data['vtt']);

            MediaAsset::query()->updateOrCreate(
                [
                    'episode_id' => $episode->id,
                    'kind' => MediaKind::VideoMaster,
                    'provider' => MediaProvider::Self,
                ],
                [
                    'disk' => 'public',
                    'path' => $videoRel,
                    'mime_type' => 'video/mp4',
                    'size_bytes' => File::size(Storage::disk('public')->path($videoRel)),
                    'meta' => ['seed' => true],
                ]
            );

            MediaAsset::query()->updateOrCreate(
                [
                    'episode_id' => $episode->id,
                    'kind' => MediaKind::Subtitle,
                    'provider' => MediaProvider::Self,
                ],
                [
                    'disk' => 'public',
                    'path' => $vttRel,
                    'mime_type' => 'text/vtt',
                    'size_bytes' => mb_strlen($data['vtt']),
                    'meta' => ['language' => 'sq'],
                ]
            );
        }
    }

    private function seedCurriculumLinks(): void
    {
        $colorEpisode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->first();
        $animalEpisode = Episode::query()->where('slug', 'kafshet-qeni-dhe-macja')->first();
        $colorPop = Game::query()->where('slug', 'color-pop')->first();
        $touch = Game::query()->where('slug', 'touch-and-tap')->first();
        $memory = Game::query()->where('slug', 'memory')->first();
        $ngjyrat = Topic::query()->where('slug', 'ngjyrat')->first();

        if ($colorEpisode && $colorPop) {
            CurriculumLink::query()->updateOrCreate(
                [
                    'episode_id' => $colorEpisode->id,
                    'game_id' => $colorPop->id,
                    'relation' => 'reinforces',
                ],
                [
                    'topic_id' => $ngjyrat?->id,
                    'sort_order' => 1,
                ]
            );
        }

        if ($animalEpisode && $memory) {
            CurriculumLink::query()->updateOrCreate(
                [
                    'episode_id' => $animalEpisode->id,
                    'game_id' => $memory->id,
                    'relation' => 'reinforces',
                ],
                [
                    'topic_id' => Topic::query()->where('slug', 'kafshet')->value('id'),
                    'sort_order' => 1,
                ]
            );
        }

        if ($ngjyrat && $touch) {
            // topic-level fallback
            $exists = CurriculumLink::query()
                ->where('topic_id', $ngjyrat->id)
                ->whereNull('episode_id')
                ->where('game_id', $touch->id)
                ->exists();

            if (! $exists) {
                CurriculumLink::query()->create([
                    'topic_id' => $ngjyrat->id,
                    'episode_id' => null,
                    'game_id' => $touch->id,
                    'relation' => 'reinforces',
                    'sort_order' => 2,
                ]);
            }
        }
    }

    private function seedProduction(): void
    {
        $editor = User::query()->where('email', 'editor@playzone.test')->first();
        $topic = Topic::query()->where('slug', 'ngjyrat')->first();
        $episode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->first();

        $specPayload = [
            'version' => '1',
            'language' => 'sq',
            'age_band' => '1-3',
            'episode_slug' => 'ngjyrat-kuq-kalter-verdh-gjelber',
            'learning_goals' => [
                'Identify four basic colors in Albanian',
                'Respond to “Ku është…?” with co-play',
            ],
            'vocabulary' => [
                ['word' => 'e kuqe', 'en' => 'red'],
                ['word' => 'e kaltër', 'en' => 'blue'],
                ['word' => 'e verdhë', 'en' => 'yellow'],
                ['word' => 'e gjelbër', 'en' => 'green'],
                ['word' => 'topi', 'en' => 'ball'],
            ],
            'structure' => [
                ['block' => 'hello_song', 'duration_seconds' => 60],
                ['block' => 'colors_intro', 'duration_seconds' => 240],
                ['block' => 'interactive', 'duration_seconds' => 180],
                ['block' => 'goodbye_song', 'duration_seconds' => 60],
            ],
            'principles' => [
                'short_phrases' => true,
                'pause_seconds' => 5,
            ],
            'outputs_required' => ['script', 'storyboard', 'subtitles_vtt'],
        ];

        $spec = ProductionSpec::query()->updateOrCreate(
            ['slug' => 'ngjyrat-pilot-v1'],
            [
                'title' => 'Ngjyrat pilot (animated)',
                'episode_slug' => 'ngjyrat-kuq-kalter-verdh-gjelber',
                'topic_id' => $topic?->id,
                'episode_id' => $episode?->id,
                'spec' => $specPayload,
                'version' => '1',
                'created_by' => $editor?->id,
            ]
        );

        ProductionSpec::query()->updateOrCreate(
            ['slug' => 'kafshet-pilot-v1'],
            [
                'title' => 'Kafshët short pilot',
                'episode_slug' => 'kafshet-qeni-dhe-macja',
                'topic_id' => Topic::query()->where('slug', 'kafshet')->value('id'),
                'episode_id' => Episode::query()->where('slug', 'kafshet-qeni-dhe-macja')->value('id'),
                'spec' => [
                    'version' => '1',
                    'language' => 'sq',
                    'age_band' => '1-3',
                    'episode_slug' => 'kafshet-qeni-dhe-macja',
                    'learning_goals' => ['Name dog and cat', 'Imitate animal sounds'],
                    'vocabulary' => [
                        ['word' => 'qeni', 'en' => 'dog'],
                        ['word' => 'macja', 'en' => 'cat'],
                    ],
                    'structure' => [
                        ['block' => 'hello', 'duration_seconds' => 20],
                        ['block' => 'animals', 'duration_seconds' => 70],
                        ['block' => 'goodbye', 'duration_seconds' => 30],
                    ],
                    'principles' => ['short_phrases' => true, 'pause_seconds' => 4],
                    'outputs_required' => ['script'],
                ],
                'version' => '1',
                'created_by' => $editor?->id,
            ]
        );

        $run = ProductionRun::query()->updateOrCreate(
            [
                'production_spec_id' => $spec->id,
                'status' => ProductionRunStatus::Approved,
            ],
            [
                'current_stage' => ProductionStage::Quality,
                'started_by' => $editor?->id,
                'started_at' => now()->subDay(),
                'script_approved_by' => $editor?->id,
                'script_approved_at' => now()->subHours(20),
                'final_approved_by' => $editor?->id,
                'final_approved_at' => now()->subHours(12),
                'completed_at' => now()->subHours(12),
                'meta' => ['seed' => true],
            ]
        );

        $stub = app(StubProductionAgent::class);
        $stub->writeArtifact($run, ProductionStage::Curriculum, ArtifactKind::Curriculum);
        $stub->writeArtifact($run, ProductionStage::Script, ArtifactKind::Script);
        $stub->writeArtifact($run, ProductionStage::Storyboard, ArtifactKind::Storyboard);
        $stub->writeArtifact($run, ProductionStage::Editor, ArtifactKind::SubtitlesVtt);

        ProductionArtifact::query()->updateOrCreate(
            [
                'production_run_id' => $run->id,
                'kind' => ArtifactKind::VisualApproval,
                'version' => 1,
            ],
            [
                'stage' => ProductionStage::Quality,
                'payload' => [
                    'approved' => true,
                    'notes' => 'Seed visual approval for pilot package (placeholder animation).',
                    'approved_by' => $editor?->email,
                ],
                'meta' => ['seed' => true],
            ]
        );
    }

    private function ensureMp4(string $absolutePath): void
    {
        $dir = dirname($absolutePath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if (is_file($absolutePath) && filesize($absolutePath) > 32) {
            return;
        }

        // Minimal placeholder MP4 (ftyp + free + mdat) — valid enough for storage seeding.
        $bytes = base64_decode(
            'AAAAIGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAGm1kYXQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
            true
        );

        file_put_contents(
            $absolutePath,
            $bytes !== false ? $bytes : "\0\0\0\x18ftypmp42\0\0\0\0mp42isom"
        );
    }
}
