import { Head, Link, usePage } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { dashboard, home, login, register } from '@/routes';

type GameCard = {
    slug: string;
    name: string;
    description: string | null;
    href: string;
    emoji: string;
    badge: string | null;
    ageBand: string;
    gradient: string;
};

type EpisodeCard = {
    slug: string;
    title: string;
    summary: string | null;
    durationSeconds: number | null;
    ageBand: string;
    topicName?: string | null;
    href: string;
    emoji: string;
};

type HomeProps = {
    featuredEpisodes: EpisodeCard[];
    toddlerGames: GameCard[];
    moreGames: GameCard[];
    locale: 'sq' | 'en';
    features: { videos: boolean; studio: boolean; toddlerHome: boolean };
};

function GameCardLink({ game }: { game: GameCard }) {
    return (
        <Link
            href={game.href}
            className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-1 shadow-lg ring-4 ring-transparent transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-fuchsia-200 focus-visible:ring-4 focus-visible:ring-fuchsia-300 focus-visible:outline-none"
        >
            <div
                className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${game.gradient} rounded-[1.25rem]`}
            >
                <span className="text-6xl drop-shadow-md transition duration-300 group-hover:scale-110">
                    {game.emoji}
                </span>
                {game.badge ? (
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow">
                        {game.badge}
                    </span>
                ) : null}
                <span className="absolute top-3 right-3 rounded-full bg-black/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">
                    {game.ageBand}
                </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-lg font-black text-slate-900">{game.name}</h2>
                <p className="flex-1 text-sm font-medium text-slate-500">
                    {game.description}
                </p>
            </div>
        </Link>
    );
}

export default function Welcome({
    featuredEpisodes = [],
    toddlerGames = [],
    moreGames = [],
    features,
}: HomeProps) {
    const { auth } = usePage().props;
    const { t, locale, toggleLocale } = useLocale();
    const showVideos = features?.videos && featuredEpisodes.length >= 0;

    return (
        <>
            <Head title="PlayZone Kids" />
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-200 via-fuchsia-100 to-amber-100">
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="absolute -top-24 -left-16 size-72 rounded-full bg-yellow-300/50 blur-3xl" />
                    <div className="absolute top-1/4 -right-20 size-80 rounded-full bg-pink-300/40 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-cyan-300/40 blur-3xl" />
                </div>

                <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur"
                        >
                            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xl shadow">
                                🎮
                            </span>
                            <div>
                                <p className="text-sm leading-none font-black tracking-tight text-slate-800 sm:text-base">
                                    PlayZone Kids
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    {t('app.tagline')}
                                </p>
                            </div>
                        </Link>

                        <nav className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleLocale}
                                className="rounded-full bg-white/90 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-white"
                                aria-label="Toggle language"
                            >
                                {locale === 'sq' ? 'EN' : 'SQ'}
                            </button>
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white hover:shadow"
                                >
                                    {t('nav.dashboard', 'Dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white/70"
                                    >
                                        {t('nav.login')}
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:scale-105 hover:bg-slate-800"
                                    >
                                        {t('nav.register')}
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="mb-10 text-center sm:mb-12">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-fuchsia-700 shadow-sm backdrop-blur">
                            <Sparkles className="size-4" aria-hidden />
                            1–3 · SQ · Free · Safe
                        </div>
                        <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            {t('home.hero_title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-base font-medium text-slate-600 sm:text-lg">
                            {t('home.hero_subtitle')}
                        </p>
                        <p className="mx-auto mt-3 max-w-xl rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                            {t('home.coplay_note')}
                        </p>
                    </section>

                    {showVideos ? (
                        <section className="mb-12" aria-label={t('home.videos')}>
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                                <h2 className="text-2xl font-black text-slate-900">
                                    🎬 {t('home.featured_videos')}
                                </h2>
                                <Link
                                    href="/videos"
                                    className="text-sm font-bold text-fuchsia-700 underline-offset-4 hover:underline"
                                >
                                    {t('home.watch_all')} →
                                </Link>
                            </div>
                            {featuredEpisodes.length === 0 ? (
                                <p className="rounded-2xl bg-white/70 px-4 py-6 text-center font-medium text-slate-500">
                                    {t('videos.empty')}
                                </p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {featuredEpisodes.map((episode) => (
                                        <Link
                                            key={episode.slug}
                                            href={episode.href}
                                            className="group overflow-hidden rounded-3xl bg-white p-1 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                                        >
                                            <div className="flex h-32 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-violet-400 to-fuchsia-500">
                                                <span className="text-5xl">{episode.emoji}</span>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-600">
                                                    {episode.topicName}
                                                </p>
                                                <h3 className="mt-1 text-lg font-black text-slate-900">
                                                    {episode.title}
                                                </h3>
                                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                                    {episode.summary}
                                                </p>
                                                <span className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                                                    {t('videos.play')} →
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : null}

                    <section className="mb-12" aria-label={t('home.toddler_games')}>
                        <h2 className="mb-4 text-2xl font-black text-slate-900">
                            🧸 {t('home.toddler_games')}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                            {toddlerGames.map((game) => (
                                <GameCardLink key={game.slug} game={game} />
                            ))}
                        </div>
                    </section>

                    {moreGames.length > 0 ? (
                        <section className="mb-12" aria-label={t('home.more_games')}>
                            <details className="rounded-3xl bg-white/60 p-4 shadow-sm backdrop-blur open:bg-white/80">
                                <summary className="cursor-pointer list-none text-xl font-black text-slate-800">
                                    🎲 {t('home.more_games')}
                                    <span className="ml-2 text-sm font-semibold text-slate-500">
                                        (4+)
                                    </span>
                                </summary>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                                    {moreGames.map((game) => (
                                        <GameCardLink key={game.slug} game={game} />
                                    ))}
                                </div>
                            </details>
                        </section>
                    ) : null}

                    <footer className="mt-12 mb-4 text-center">
                        <p className="text-sm font-medium text-slate-500">
                            {t('footer.made_for')} 🎉
                        </p>
                        <Link
                            href="/privacy"
                            className="mt-2 inline-block text-sm font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                        >
                            {t('nav.privacy')}
                        </Link>
                    </footer>
                </div>
            </div>
        </>
    );
}
