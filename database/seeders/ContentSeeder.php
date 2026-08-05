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
use Illuminate\Support\Str;
use RuntimeException;

final class ContentSeeder extends Seeder
{
    /**
     * Fixture mapping for published Imagine / pilot masters.
     *
     * @var array<string, string>
     */
    private const VIDEO_FIXTURES = [
        'ngjyrat-kuq-kalter-verdh-gjelber' => 'assembled/ep-ngjyrat-kuq-kalter-verdh-gjelber.mp4',
        'ngjyrat-kuq-kalter-verdh-gjelber-realiste' => 'assembled/ep-ngjyrat-kuq-kalter-verdh-gjelber-realiste.mp4',
        'kafshet-qeni-dhe-macja' => 'assembled/ep-kafshet-qeni-dhe-macja.mp4',
        'pershendetjet-miremengjesi' => 'assembled/ep-pershendetjet-miremengjesi.mp4',
        'trupi-koka-duart-kembe' => 'assembled/ep-trupi-koka-duart-kembe.mp4',
        'fjalet-mama-baba-po-jo' => 'assembled/ep-fjalet-mama-baba-po-jo.mp4',
        'qetesia-fryma' => 'assembled/ep-qetesia-fryma.mp4',
        'ndjenjat-trishtim-dhe-perqafim' => 'assembled/ep-ndjenjat-trishtim-dhe-perqafim.mp4',
        'ngjyrat-e-kuqe' => 'assembled/ep-ngjyrat-e-kuqe.mp4',
        'kafshet-miau-me-kiki' => 'assembled/ep-kafshet-miau-me-kiki.mp4',
        'special-miresevini-ne-playzone' => 'assembled/ep-special-miresevini-ne-playzone.mp4',
        'qetesia-nate-e-mire' => 'assembled/ep-qetesia-nate-e-mire.mp4',
        'historite-topi-i-humbyer' => 'assembled/ep-historite-topi-i-humbyer.mp4',
        'numrat-nje-dy-tre' => 'assembled/ep-numrat-nje-dy-tre.mp4',
        'levizja-kerce-trokit' => 'assembled/ep-levizja-kerce-trokit.mp4',
    ];

    public function run(): void
    {
        $this->seedEditor();
        $this->seedTopicsAndSeries();
        $this->seedGames();
        $this->seedEpisodesAndMedia();
        $this->seedCurriculumLinks();
        $this->seedProduction();
    }

    /**
     * @return array{topics: list<array<string, mixed>>, episodes: list<array<string, mixed>>}
     */
    private function catalog(): array
    {
        $path = base_path('content/catalog/episodes-catalog.json');
        if (! is_file($path)) {
            return ['topics' => [], 'episodes' => []];
        }

        /** @var array{topics?: list<array<string, mixed>>, episodes?: list<array<string, mixed>>} $data */
        $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        return [
            'topics' => $data['topics'] ?? [],
            'episodes' => $data['episodes'] ?? [],
        ];
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
        $catalogTopics = $this->catalog()['topics'];

        $topics = $catalogTopics !== [] ? $catalogTopics : [
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
                    'name_sq' => $topicData['name_sq'],
                    'name_en' => $topicData['name_en'],
                    'description_sq' => $topicData['description_sq'] ?? null,
                    'description_en' => $topicData['description_en'] ?? null,
                    'skills' => $topicData['skills'] ?? ['language'],
                    'sort_order' => (int) ($topicData['sort_order'] ?? 0),
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

        $catalogEpisodes = $this->catalog()['episodes'];
        $sort = 0;

        if ($catalogEpisodes === []) {
            $this->seedLegacyPilotEpisodes();

            return;
        }

        // Prefer stable featured sort for published pilots.
        $featuredSort = [
            'ngjyrat-kuq-kalter-verdh-gjelber' => 1,
            'ngjyrat-kuq-kalter-verdh-gjelber-realiste' => 1,
            'pershendetjet-miremengjesi' => 2,
            'kafshet-qeni-dhe-macja' => 3,
            'trupi-koka-duart-kembe' => 4,
            'fjalet-mama-baba-po-jo' => 5,
            'qetesia-fryma' => 6,
            'ndjenjat-trishtim-dhe-perqafim' => 7,
            'ngjyrat-e-kuqe' => 8,
            'kafshet-miau-me-kiki' => 9,
            'special-miresevini-ne-playzone' => 10,
            'qetesia-nate-e-mire' => 11,
            'historite-topi-i-humbyer' => 12,
            'numrat-nje-dy-tre' => 13,
            'levizja-kerce-trokit' => 14,
        ];

        foreach ($catalogEpisodes as $data) {
            $sort++;
            $slug = (string) $data['slug'];
            $topicSlug = (string) $data['topic'];
            $series = Series::query()->where('slug', $topicSlug.'-seria-1')->first();
            if ($series === null) {
                continue;
            }

            $hasFixture = isset(self::VIDEO_FIXTURES[$slug]);
            $publish = $hasFixture;
            $ageBand = match ((string) ($data['age_band'] ?? '1-3')) {
                '1-2' => AgeBand::OneToTwo,
                '2-3' => AgeBand::TwoToThree,
                default => AgeBand::OneToThree,
            };

            $skills = ['language'];
            if (isset($data['type']) && is_string($data['type'])) {
                $skills[] = $data['type'];
            }

            $fixture = $hasFixture ? self::VIDEO_FIXTURES[$slug] : null;
            $duration = (int) ($data['duration_seconds'] ?? 180);
            if ($fixture !== null) {
                $fixtureAbs = database_path('seeders/fixtures/'.$fixture);
                if (is_file($fixtureAbs)) {
                    $probed = $this->probeDurationSeconds($fixtureAbs);
                    if ($probed !== null) {
                        $duration = $probed;
                    }
                }
            }

            $episode = Episode::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'series_id' => $series->id,
                    'title_sq' => (string) $data['title_sq'],
                    'title_en' => (string) $data['title_en'],
                    'language' => 'sq',
                    'age_band' => $ageBand,
                    'status' => $publish ? EpisodeStatus::Published : EpisodeStatus::Draft,
                    'duration_seconds' => $duration,
                    'episode_number' => $sort,
                    'sort_order' => $featuredSort[$slug] ?? (100 + $sort),
                    'summary_sq' => (string) ($data['summary_sq'] ?? ''),
                    'summary_en' => (string) ($data['summary_en'] ?? ''),
                    'published_at' => $publish ? now() : null,
                    'skills' => $skills,
                ]
            );

            if (! $publish || $fixture === null) {
                continue;
            }

            $vttPath = base_path('content/episodes/'.$slug.'/captions.vtt');
            $vtt = is_file($vttPath)
                ? (string) file_get_contents($vttPath)
                : $this->fallbackVtt((string) $data['title_sq']);

            $this->attachEpisodeMedia($episode, $fixture, $vtt);
        }
    }

    private function probeDurationSeconds(string $absolutePath): ?int
    {
        $ffmpeg = getenv('HOME').'/.local/bin/ffprobe';
        if (! is_file($ffmpeg)) {
            $ffmpeg = 'ffprobe';
        }

        $cmd = sprintf(
            '%s -v error -show_entries format=duration -of csv=p=0 %s 2>/dev/null',
            escapeshellcmd($ffmpeg),
            escapeshellarg($absolutePath),
        );
        $out = trim((string) shell_exec($cmd));
        if ($out === '' || ! is_numeric($out)) {
            return null;
        }

        return max(1, (int) round((float) $out));
    }

    /**
     * Fallback when content catalog is missing (older checkouts).
     */
    private function seedLegacyPilotEpisodes(): void
    {
        $episodes = [
            [
                'topic' => 'ngjyrat',
                'slug' => 'ngjyrat-kuq-kalter-verdh-gjelber',
                'title_sq' => 'Ngjyrat: E kuqe, e kaltër, e verdhë, e gjelbër',
                'title_en' => 'Colors: Red, blue, yellow, green',
                'summary_sq' => 'Lumi këndon dhe tregon katër ngjyrat.',
                'summary_en' => 'Lumi sings and shows four colors.',
                'duration' => 180,
                'sort' => 1,
                'fixture' => 'pilot-colors.mp4',
            ],
            [
                'topic' => 'kafshet',
                'slug' => 'kafshet-qeni-dhe-macja',
                'title_sq' => 'Kafshët: Qeni dhe macja',
                'title_en' => 'Animals: Dog and cat',
                'summary_sq' => 'Qeni ham ham dhe macja miau.',
                'summary_en' => 'Dog woof and cat meow.',
                'duration' => 120,
                'sort' => 2,
                'fixture' => 'pilot-animals.mp4',
            ],
            [
                'topic' => 'pershendetjet',
                'slug' => 'pershendetjet-miremengjesi',
                'title_sq' => 'Përshëndetjet: Mirëmëngjesi',
                'title_en' => 'Greetings: Good morning',
                'summary_sq' => 'Kënga e mirëmëngjesit.',
                'summary_en' => 'Good morning song.',
                'duration' => 90,
                'sort' => 3,
                'fixture' => 'pilot-greetings.mp4',
            ],
            [
                'topic' => 'pjeset-e-trupit',
                'slug' => 'trupi-koka-duart-kembe',
                'title_sq' => 'Trupi: Koka, duart, këmbët',
                'title_en' => 'Body: Head, hands, feet',
                'summary_sq' => 'Prekim kokën, duart dhe këmbët.',
                'summary_en' => 'Touch head, hands, and feet.',
                'duration' => 100,
                'sort' => 4,
                'fixture' => 'lumi-body-parts.mp4',
            ],
            [
                'topic' => 'fjalet-e-para',
                'slug' => 'fjalet-mama-baba-po-jo',
                'title_sq' => 'Fjalët e para: Mama, baba, po, jo',
                'title_en' => 'First words: Mama, baba, yes, no',
                'summary_sq' => 'Fjalë të para me përsëritje.',
                'summary_en' => 'First words with repetition.',
                'duration' => 95,
                'sort' => 5,
                'fixture' => 'pilot-animals.mp4',
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
            $this->attachEpisodeMedia($episode, $data['fixture'], $this->fallbackVtt($data['title_sq']));
        }
    }

    private function attachEpisodeMedia(Episode $episode, string $fixture, string $vtt): void
    {
        $disk = (string) config('media.self.disk', 'local');

        $existingVideo = MediaAsset::query()
            ->where('episode_id', $episode->id)
            ->where('kind', MediaKind::VideoMaster)
            ->where('provider', MediaProvider::Self)
            ->first();

        $uuid = $existingVideo?->path
            ? basename(dirname((string) $existingVideo->path))
            : (string) Str::uuid();
        $videoRel = 'episodes/'.$uuid.'/video_master.mp4';
        $vttRel = 'episodes/'.$uuid.'/subtitle.vtt';

        $this->ensurePlayableMp4(
            Storage::disk($disk)->path($videoRel),
            $fixture,
        );
        Storage::disk($disk)->put($vttRel, $vtt);

        MediaAsset::query()->updateOrCreate(
            [
                'episode_id' => $episode->id,
                'kind' => MediaKind::VideoMaster,
                'provider' => MediaProvider::Self,
            ],
            [
                'disk' => $disk,
                'path' => $videoRel,
                'mime_type' => 'video/mp4',
                'size_bytes' => File::size(Storage::disk($disk)->path($videoRel)),
                'meta' => ['seed' => true, 'fixture' => $fixture],
            ]
        );

        MediaAsset::query()->updateOrCreate(
            [
                'episode_id' => $episode->id,
                'kind' => MediaKind::Subtitle,
                'provider' => MediaProvider::Self,
            ],
            [
                'disk' => $disk,
                'path' => $vttRel,
                'mime_type' => 'text/vtt',
                'size_bytes' => mb_strlen($vtt),
                'meta' => ['language' => 'sq'],
            ]
        );
    }

    private function fallbackVtt(string $title): string
    {
        return "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nPërshëndetje, miq të vegjël!\n\n00:00:05.000 --> 00:00:12.000\n{$title}\n\n00:00:13.000 --> 00:00:18.000\nShumë mirë! Mirupafshim!\n";
    }

    private function seedCurriculumLinks(): void
    {
        $colorEpisode = Episode::query()->where('slug', 'ngjyrat-kuq-kalter-verdh-gjelber')->first();
        $animalEpisode = Episode::query()->where('slug', 'kafshet-qeni-dhe-macja')->first();
        $bodyEpisode = Episode::query()->where('slug', 'trupi-koka-duart-kembe')->first();
        $feelingsEpisode = Episode::query()->where('slug', 'ndjenjat-trishtim-dhe-perqafim')->first();
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

        if ($bodyEpisode && $touch) {
            CurriculumLink::query()->updateOrCreate(
                [
                    'episode_id' => $bodyEpisode->id,
                    'game_id' => $touch->id,
                    'relation' => 'reinforces',
                ],
                [
                    'topic_id' => Topic::query()->where('slug', 'pjeset-e-trupit')->value('id'),
                    'sort_order' => 1,
                ]
            );
        }

        if ($feelingsEpisode && $touch) {
            CurriculumLink::query()->updateOrCreate(
                [
                    'episode_id' => $feelingsEpisode->id,
                    'game_id' => $touch->id,
                    'relation' => 'reinforces',
                ],
                [
                    'topic_id' => Topic::query()->where('slug', 'ndjenjat')->value('id'),
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

        // Seed production specs from content library packages (full-package episodes).
        $catalog = $this->catalog()['episodes'];
        foreach ($catalog as $ep) {
            if (($ep['package'] ?? '') !== 'full') {
                continue;
            }
            $slug = (string) $ep['slug'];
            $specPath = base_path('content/episodes/'.$slug.'/production-spec.json');
            if (! is_file($specPath)) {
                continue;
            }
            /** @var array<string, mixed> $specPayload */
            $specPayload = json_decode((string) file_get_contents($specPath), true, 512, JSON_THROW_ON_ERROR);
            ProductionSpec::query()->updateOrCreate(
                ['slug' => $slug.'-content-v1'],
                [
                    'title' => (string) $ep['title_sq'],
                    'episode_slug' => $slug,
                    'topic_id' => Topic::query()->where('slug', (string) $ep['topic'])->value('id'),
                    'episode_id' => Episode::query()->where('slug', $slug)->value('id'),
                    'spec' => $specPayload,
                    'version' => '1',
                    'created_by' => $editor?->id,
                ]
            );
        }

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

    /**
     * Copy a real playable pilot MP4 from database/seeders/fixtures.
     * Tiny header-only stubs are not browser-playable.
     */
    private function ensurePlayableMp4(string $absolutePath, string $fixtureName): void
    {
        $dir = dirname($absolutePath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $fixture = database_path('seeders/fixtures/'.$fixtureName);

        if (is_file($fixture) && filesize($fixture) > 10_000) {
            copy($fixture, $absolutePath);

            return;
        }

        // Fallback fixture if a named one is missing.
        foreach ([
            'lumi-hello-wave.mp4',
            'lumi-colors-present.mp4',
            'lumi-body-parts.mp4',
            'lumi-ari-breathe.mp4',
            'lumi-kiki-animals.mp4',
            'mimoza-bedtime.mp4',
            'pilot-colors.mp4',
            'pilot-animals.mp4',
            'pilot-greetings.mp4',
        ] as $candidate) {
            $path = database_path('seeders/fixtures/'.$candidate);
            if (is_file($path) && filesize($path) > 10_000) {
                copy($path, $absolutePath);

                return;
            }
        }

        throw new RuntimeException(
            "Playable pilot MP4 fixture missing. Expected files in database/seeders/fixtures/ (got {$fixtureName})."
        );
    }
}
