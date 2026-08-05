import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import { home } from '@/routes';

type Props = {
    series: {
        slug: string;
        title: string;
    };
    topic: {
        slug: string;
        name: string;
        href: string;
    } | null;
    episodes: Array<{
        slug: string;
        title: string;
        summary: string | null;
        href: string;
        durationSeconds?: number | null;
        ageBand?: string | null;
        episodeNumber?: number | null;
    }>;
};

export default function SeriesShow({ series, topic, episodes }: Props) {
    const { t } = useLocale();

    return (
        <>
            <Head title={series.title} />
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-sky-50 to-violet-100">
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
                        {topic ? (
                            <Link
                                href={topic.href}
                                className="inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-violet-700 shadow"
                            >
                                {topic.name}
                            </Link>
                        ) : null}
                    </div>

                    <div className="mb-8 overflow-hidden rounded-3xl bg-white p-1 shadow-lg">
                        <div className="rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-10 text-white">
                            <p className="text-sm font-bold uppercase tracking-wide text-white/80">
                                Series
                            </p>
                            <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                                {series.title}
                            </h1>
                            <p className="mt-3 text-sm font-semibold text-white/85">
                                {episodes.length}{' '}
                                {episodes.length === 1 ? 'episode' : 'episodes'}
                            </p>
                        </div>
                    </div>

                    <ol className="space-y-3">
                        {episodes.map((ep, index) => (
                            <li key={ep.slug}>
                                <Link
                                    href={ep.href}
                                    className="flex items-center gap-4 overflow-hidden rounded-3xl bg-white p-2 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 text-2xl font-black text-white">
                                        {ep.episodeNumber ?? index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1 py-2 pr-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-orange-600">
                                            {ep.ageBand ? (
                                                <span>{ep.ageBand}</span>
                                            ) : null}
                                            {ep.durationSeconds ? (
                                                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-700 normal-case">
                                                    {Math.round(
                                                        ep.durationSeconds / 60,
                                                    ) || 1}
                                                    min
                                                </span>
                                            ) : null}
                                        </div>
                                        <h2 className="truncate text-lg font-black text-slate-900">
                                            {ep.title}
                                        </h2>
                                        {ep.summary ? (
                                            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                                                {ep.summary}
                                            </p>
                                        ) : null}
                                    </div>
                                    <span className="mr-2 hidden rounded-full bg-slate-900 px-3 py-1.5 text-sm font-bold text-white sm:inline-flex">
                                        {t('videos.play')}
                                    </span>
                                </Link>
                            </li>
                        ))}
                        {episodes.length === 0 ? (
                            <p className="rounded-2xl bg-white px-4 py-8 text-center font-medium text-slate-500 shadow">
                                {t('videos.empty')}
                            </p>
                        ) : null}
                    </ol>
                </div>
            </div>
        </>
    );
}
