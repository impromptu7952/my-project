import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import { home } from '@/routes';
import { cn } from '@/lib/utils';

type EpisodeCard = {
    slug: string;
    title: string;
    summary: string | null;
    durationSeconds: number | null;
    ageBand: string;
    topicName?: string | null;
    topicSlug?: string | null;
    seriesSlug?: string | null;
    seriesHref?: string | null;
    href: string;
    emoji: string;
};

type TopicChip = {
    slug: string;
    name: string;
    href: string;
    topicPageHref?: string;
};

type Props = {
    episodes: EpisodeCard[];
    topics?: TopicChip[];
    activeTopic?: string | null;
};

function formatDuration(seconds: number | null): string {
    if (!seconds) {
        return '';
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideosIndex({
    episodes,
    topics = [],
    activeTopic = null,
}: Props) {
    const { t } = useLocale();

    return (
        <>
            <Head title={t('home.videos', 'Videos')} />
            <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50">
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href={home()}
                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow"
                        >
                            ← {t('games.home')}
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900">
                            🎬 {t('home.videos')}
                        </h1>
                    </div>

                    <p className="mb-6 max-w-2xl text-base font-medium text-slate-600">
                        {t(
                            'home.coplay_note',
                            'Grown-ups: play together with under-2s',
                        )}
                    </p>

                    {topics.length > 0 ? (
                        <div className="mb-8 flex flex-wrap gap-2">
                            <Link
                                href="/videos"
                                className={cn(
                                    'rounded-full px-4 py-2 text-sm font-bold shadow-sm transition',
                                    !activeTopic
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-700 hover:bg-white/90',
                                )}
                            >
                                {t('home.watch_all', 'All')}
                            </Link>
                            {topics.map((topic) => (
                                <Link
                                    key={topic.slug}
                                    href={topic.href}
                                    className={cn(
                                        'rounded-full px-4 py-2 text-sm font-bold shadow-sm transition',
                                        activeTopic === topic.slug
                                            ? 'bg-fuchsia-600 text-white'
                                            : 'bg-white text-slate-700 hover:bg-white/90',
                                    )}
                                >
                                    {topic.name}
                                </Link>
                            ))}
                            {activeTopic
                                ? topics
                                      .filter((t) => t.slug === activeTopic)
                                      .map((topic) =>
                                          topic.topicPageHref ? (
                                              <Link
                                                  key={`${topic.slug}-page`}
                                                  href={topic.topicPageHref}
                                                  className="rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-800 shadow-sm"
                                              >
                                                  Topic page →
                                              </Link>
                                          ) : null,
                                      )
                                : null}
                        </div>
                    ) : null}

                    {episodes.length === 0 ? (
                        <p className="rounded-3xl bg-white p-8 text-center font-medium text-slate-500 shadow">
                            {t('videos.empty')}
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {episodes.map((episode) => (
                                <Link
                                    key={episode.slug}
                                    href={episode.href}
                                    className="overflow-hidden rounded-3xl bg-white p-1 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-fuchsia-300 focus-visible:outline-none"
                                >
                                    <div className="relative flex h-36 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-violet-400 to-pink-500">
                                        <span className="text-6xl">
                                            {episode.emoji}
                                        </span>
                                        <span className="absolute top-3 right-3 rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">
                                            {episode.ageBand}
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs font-bold uppercase text-fuchsia-600">
                                            {episode.topicName}
                                        </p>
                                        <h2 className="mt-1 text-lg font-black text-slate-900">
                                            {episode.title}
                                        </h2>
                                        <p className="mt-1 line-clamp-3 text-sm text-slate-500">
                                            {episode.summary}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400">
                                                {formatDuration(
                                                    episode.durationSeconds,
                                                )}
                                            </span>
                                            <span className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-bold text-white">
                                                {t('videos.play')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
