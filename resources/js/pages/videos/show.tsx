import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Html5Player } from '@/components/videos/html5-player';
import { useLocale } from '@/hooks/use-locale';
import { home } from '@/routes';

type Props = {
    episode: {
        id: number;
        slug: string;
        title: string;
        summary: string | null;
        durationSeconds: number | null;
        ageBand: string;
        topicName?: string | null;
        topicSlug?: string | null;
        seriesTitle?: string | null;
    };
    playback: {
        provider: string;
        src: string | null;
        captionsSrc: string | null;
        poster: string | null;
        mimeType: string | null;
        language?: string | null;
    };
    linkedGames: Array<{
        slug: string;
        name: string;
        emoji: string;
        href: string;
        ageBand?: string | null;
    }>;
    nextEpisode: { slug: string; title: string; href: string } | null;
};

export default function VideoShow({
    episode,
    playback,
    linkedGames,
    nextEpisode,
}: Props) {
    const { t } = useLocale();
    const { auth } = usePage().props;
    const isAuthed = Boolean(auth.user);

    // Lightweight progress ping for signed-in parents (no child tracking beyond account).
    useEffect(() => {
        if (!isAuthed || !playback.src) {
            return;
        }

        const timer = window.setTimeout(() => {
            router.post(
                '/parent/progress',
                {
                    episode_id: episode.id,
                    position_seconds: 5,
                    duration_seconds: episode.durationSeconds,
                },
                { preserveState: true, preserveScroll: true },
            );
        }, 8000);

        return () => window.clearTimeout(timer);
    }, [isAuthed, playback.src, episode.id, episode.durationSeconds]);

    return (
        <>
            <Head title={episode.title} />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-fuchsia-900 text-white">
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <Link
                            href={
                                episode.topicSlug
                                    ? `/videos?topic=${episode.topicSlug}`
                                    : '/videos'
                            }
                            className="min-h-12 rounded-full bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/25"
                        >
                            ← {t('home.videos')}
                        </Link>
                        <Link
                            href={home()}
                            className="min-h-12 rounded-full bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20"
                        >
                            {t('games.home')}
                        </Link>
                    </div>

                    {playback.src ? (
                        <Html5Player
                            src={playback.src}
                            captionsSrc={playback.captionsSrc}
                            poster={playback.poster}
                            title={episode.title}
                            mimeType={playback.mimeType}
                            captionsLang={playback.language ?? 'sq'}
                        />
                    ) : (
                        <div className="flex aspect-video items-center justify-center rounded-3xl bg-black/40 text-lg font-bold">
                            Video coming soon
                        </div>
                    )}

                    <div className="mt-6 rounded-3xl bg-white/10 p-5 backdrop-blur sm:p-6">
                        <p className="text-sm font-bold uppercase tracking-wide text-fuchsia-200">
                            {episode.topicName} · {episode.ageBand}
                        </p>
                        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                            {episode.title}
                        </h1>
                        {episode.summary ? (
                            <p className="mt-3 text-base font-medium text-white/80">
                                {episode.summary}
                            </p>
                        ) : null}
                        <p className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-sm font-medium text-white/85">
                            {t(
                                'home.coplay_note',
                                'Grown-ups: sit together, pause for answers, clap and point along.',
                            )}
                        </p>
                    </div>

                    {linkedGames.length > 0 ? (
                        <div className="mt-6">
                            <h2 className="mb-3 text-xl font-black">
                                {t('videos.related_game')}
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {linkedGames.map((game) => (
                                    <Link
                                        key={game.slug}
                                        href={game.href}
                                        className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 text-lg font-black shadow-lg transition hover:scale-105"
                                    >
                                        <span className="text-2xl">
                                            {game.emoji}
                                        </span>
                                        {t('cta.play_now')} — {game.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {nextEpisode ? (
                        <div className="mt-8">
                            <Link
                                href={nextEpisode.href}
                                className="inline-flex rounded-full bg-white/15 px-5 py-3 text-sm font-bold hover:bg-white/25"
                            >
                                Next: {nextEpisode.title} →
                            </Link>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
