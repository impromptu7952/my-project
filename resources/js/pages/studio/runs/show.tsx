import { Head, Link, router } from '@inertiajs/react';

type Props = {
    run: {
        id: number;
        status: string;
        currentStage: string | null;
        error: string | null;
        startedAt: string | null;
        scriptApprovedAt: string | null;
        finalApprovedAt: string | null;
        spec: {
            slug: string | null;
            title: string | null;
            episodeSlug: string | null;
        };
        artifacts: Array<{
            id: number;
            kind: string;
            stage: string | null;
            version: number;
            payload: unknown;
        }>;
    };
};

export default function StudioRunShow({ run }: Props) {
    return (
        <>
            <Head title={`Run #${run.id}`} />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    {run.spec.slug ? (
                        <Link
                            href={`/studio/specs/${run.spec.slug}`}
                            className="text-sm font-bold text-slate-600"
                        >
                            ← {run.spec.title}
                        </Link>
                    ) : null}
                    <div>
                        <h1 className="text-2xl font-black">Run #{run.id}</h1>
                        <p className="font-semibold text-slate-600">
                            Status: {run.status} · Stage: {run.currentStage}
                        </p>
                        {run.error ? (
                            <p className="mt-2 rounded bg-red-50 p-3 text-sm text-red-700">
                                {run.error}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {run.status === 'awaiting_script_review' ? (
                            <>
                                <button
                                    type="button"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                                    onClick={() =>
                                        router.post(`/studio/runs/${run.id}/approve`, {
                                            gate: 'script',
                                        })
                                    }
                                >
                                    Approve script
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
                                    onClick={() =>
                                        router.post(`/studio/runs/${run.id}/reject`, {
                                            reason: 'Needs rewrite',
                                        })
                                    }
                                >
                                    Reject
                                </button>
                            </>
                        ) : null}
                        {run.status === 'awaiting_final_review' ? (
                            <>
                                <button
                                    type="button"
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                                    onClick={() =>
                                        router.post(`/studio/runs/${run.id}/approve`, {
                                            gate: 'final',
                                        })
                                    }
                                >
                                    Approve final
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
                                    onClick={() =>
                                        router.post(`/studio/runs/${run.id}/reject`)
                                    }
                                >
                                    Reject
                                </button>
                            </>
                        ) : null}
                        {run.status === 'failed' ? (
                            <button
                                type="button"
                                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white"
                                onClick={() =>
                                    router.post(`/studio/runs/${run.id}/retry`, {
                                        chain: 'a',
                                    })
                                }
                            >
                                Retry chain A
                            </button>
                        ) : null}
                        {run.status === 'approved' && run.spec.episodeSlug ? (
                            <button
                                type="button"
                                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white"
                                onClick={() =>
                                    router.post(`/studio/runs/${run.id}/publish`, {
                                        episode_slug: run.spec.episodeSlug,
                                    })
                                }
                            >
                                Publish episode
                            </button>
                        ) : null}
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-lg font-black">Artifacts</h2>
                        {run.artifacts.map((artifact) => (
                            <details
                                key={artifact.id}
                                className="rounded-xl border bg-white p-3"
                            >
                                <summary className="cursor-pointer font-bold">
                                    {artifact.kind} v{artifact.version}
                                </summary>
                                <pre className="mt-2 max-h-80 overflow-auto text-xs">
                                    {JSON.stringify(artifact.payload, null, 2)}
                                </pre>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
