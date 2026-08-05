import { Head, Link } from '@inertiajs/react';

type Spec = {
    id: number;
    slug: string;
    title: string;
    episodeSlug: string | null;
    runsCount: number;
    updatedAt: string | null;
};

export default function StudioSpecsIndex({ specs }: { specs: Spec[] }) {
    return (
        <>
            <Head title="Studio — Specs" />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-black">Production Specs</h1>
                        <Link
                            href="/studio/specs/create"
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                        >
                            New spec
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {specs.map((spec) => (
                            <Link
                                key={spec.id}
                                href={`/studio/specs/${spec.slug}`}
                                className="block rounded-xl border bg-white p-4 shadow-sm hover:border-fuchsia-300"
                            >
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <h2 className="font-bold text-slate-900">{spec.title}</h2>
                                        <p className="text-sm text-slate-500">{spec.episodeSlug}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-400">
                                        {spec.runsCount} runs
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
