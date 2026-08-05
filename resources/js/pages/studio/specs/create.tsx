import { Head, Link, useForm } from '@inertiajs/react';

export default function StudioSpecsCreate() {
    const form = useForm({
        title: '',
        episode_slug: '',
        spec: {
            version: '1',
            language: 'sq',
            age_band: '1-3',
            episode_slug: '',
            learning_goals: ['colors'],
            vocabulary: [{ word: 'e kuqe', en: 'red' }],
            structure: [{ block: 'hello_song', duration_seconds: 60 }],
            principles: { short_phrases: true, pause_seconds: 4 },
            outputs_required: ['script'],
        },
    });

    return (
        <>
            <Head title="New Production Spec" />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
                    <Link href="/studio" className="text-sm font-bold text-slate-600">
                        ← Specs
                    </Link>
                    <h1 className="mb-4 mt-2 text-2xl font-black">New production spec</h1>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                spec: {
                                    ...data.spec,
                                    episode_slug: data.episode_slug || data.spec.episode_slug,
                                },
                            })).post('/studio/specs');
                        }}
                    >
                        <div>
                            <label className="text-sm font-bold">Title</label>
                            <input
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">Episode slug</label>
                            <input
                                value={form.data.episode_slug}
                                onChange={(e) => form.setData('episode_slug', e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white"
                        >
                            Create
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
