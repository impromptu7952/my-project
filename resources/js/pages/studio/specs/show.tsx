import { Head, Link, router } from '@inertiajs/react';

type Props = {
    spec: {
        id: number;
        slug: string;
        title: string;
        episodeSlug: string | null;
        spec: Record<string, unknown>;
        version: string;
    };
    runs: Array<{
        id: number;
        status: string;
        currentStage: string | null;
        startedAt: string | null;
    }>;
};

export default function StudioSpecShow({ spec, runs }: Props) {
    return (
        <>
            <Head title={spec.title} />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    <Link href="/studio" className="text-sm font-bold text-slate-600">
                        ← Specs
                    </Link>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-black">{spec.title}</h1>
                            <p className="text-sm text-slate-500">{spec.episodeSlug}</p>
                        </div>
                        <button
                            type="button"
                            className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white"
                            onClick={() => router.post(`/studio/specs/${spec.slug}/runs`)}
                        >
                            Start production run
                        </button>
                    </div>
                    <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
                        {JSON.stringify(spec.spec, null, 2)}
                    </pre>
                    <div>
                        <h2 className="mb-2 text-lg font-black">Runs</h2>
                        <div className="space-y-2">
                            {runs.map((run) => (
                                <Link
                                    key={run.id}
                                    href={`/studio/runs/${run.id}`}
                                    className="block rounded-lg border bg-white p-3 hover:border-fuchsia-300"
                                >
                                    #{run.id} · {run.status} · {run.currentStage}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
