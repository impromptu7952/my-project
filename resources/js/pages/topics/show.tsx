import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import { home } from '@/routes';

type Props = {
    topic: {
        slug: string;
        name: string;
        description: string | null;
    };
    episodes: Array<{
        slug: string;
        title: string;
        summary: string | null;
        href: string;
        durationSeconds?: number | null;
        ageBand?: string | null;
    }>;
};

const topicEmoji: Record<string, string> = {
    ngjyrat: '🌈',
    kafshet: '🐶',
    'pjeset-e-trupit': '🖐️',
    pershendetjet: '👋',
    'fjalet-e-para': '💬',
};

export default function TopicShow({ topic, episodes }: Props) {
    const { t } = useLocale();
    const emoji = topicEmoji[topic.slug] ?? '🎬';

    return (
        <>
            <Head title={topic.name} />
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-fuchsia-50 to-amber-50">
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                    <div className="mb-6 flex flex-wrap gap-2">
                        <Link
                            href={home()}
                            className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold shadow"
                        >
                            ← {t('games.home')}
                        </Link>
                        <Link
                            href="/videos"
                            className="inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow"
                        >
                            {t('home.videos')}
                        </Link>
                    </div>

                    <div className="mb-8 overflow-hidden rounded-3xl bg-white p-1 shadow-lg">
                        <div className="flex flex-col items-center gap-4 rounded-[1.25rem] bg-gradient-to-br from-violet-400 to-pink-500 px-6 py-10 text-center text-white sm:flex-row sm:text-left">
                            <span className="text-7xl drop-shadow-md">{emoji}</span>
                            <div>
                                <h1 className="text-3xl font-black sm:text-4xl">
                                    {topic.name}
                                </h1>
                                {topic.description ? (
                                    <p className="mt-2 max-w-xl text-base font-medium text-white/90">
                                        {topic.description}
                                    </p>
                                ) : null}
                                <p className="mt-3 text-sm font-semibold text-white/80">
                                    {episodes.length}{' '}
                                    {episodes.length === 1 ? 'video' : 'videos'} ·{' '}
                                    {t('home.coplay_note')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {episodes.map((ep) => (
                            <Link
                                key={ep.slug}
                                href={ep.href}
                                className="overflow-hidden rounded-3xl bg-white p-1 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                            >
                                <div className="flex h-28 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-sky-400 to-violet-500">
                                    <span className="text-5xl">{emoji}</span>
                                </div>
                                <div className="p-4">
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-fuchsia-600">
                                        {ep.ageBand ? (
                                            <span>{ep.ageBand}</span>
                                        ) : null}
                                        {ep.durationSeconds ? (
                                            <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-fuchsia-700 normal-case">
                                                {Math.round(
                                                    ep.durationSeconds / 60,
                                                ) || 1}
                                                min
                                            </span>
                                        ) : null}
                                    </div>
                                    <h2 className="mt-1 text-lg font-black text-slate-900">
                                        {ep.title}
                                    </h2>
                                    <p className="mt-1 line-clamp-3 text-sm text-slate-500">
                                        {ep.summary}
                                    </p>
                                    <span className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-sm font-bold text-white">
                                        {t('videos.play')}
                                    </span>
                                </div>
                            </Link>
                        ))}
                        {episodes.length === 0 ? (
                            <p className="col-span-full rounded-2xl bg-white px-4 py-8 text-center font-medium text-slate-500 shadow">
                                {t('videos.empty')}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
