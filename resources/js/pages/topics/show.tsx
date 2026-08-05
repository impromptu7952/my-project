import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import { home } from '@/routes';

type Props = {
    topic: { slug: string; name: string; description: string | null };
    episodes: Array<{ slug: string; title: string; summary: string | null; href: string }>;
};

export default function TopicShow({ topic, episodes }: Props) {
    const { t } = useLocale();

    return (
        <>
            <Head title={topic.name} />
            <div className="min-h-screen bg-gradient-to-br from-sky-50 to-fuchsia-50">
                <div className="mx-auto max-w-3xl px-4 py-8">
                    <Link href={home()} className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold shadow">
                        ← {t('games.home')}
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900">{topic.name}</h1>
                    <p className="mt-2 text-slate-600">{topic.description}</p>
                    <div className="mt-6 space-y-3">
                        {episodes.map((ep) => (
                            <Link key={ep.slug} href={ep.href} className="block rounded-2xl bg-white p-4 shadow">
                                <h2 className="font-black text-slate-900">{ep.title}</h2>
                                <p className="text-sm text-slate-500">{ep.summary}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
