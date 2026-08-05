import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Play, Save } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

function statusTone(status: string): string {
    if (status.includes('failed') || status.includes('rejected')) {
        return 'text-destructive';
    }
    if (status.includes('approved') || status.includes('published')) {
        return 'text-emerald-600 dark:text-emerald-400';
    }
    if (status.includes('awaiting') || status.includes('running')) {
        return 'text-amber-700 dark:text-amber-300';
    }

    return 'text-muted-foreground';
}

export default function StudioSpecShow({ spec, runs }: Props) {
    const [jsonError, setJsonError] = useState<string | null>(null);
    const form = useForm({
        title: spec.title,
        episode_slug: spec.episodeSlug ?? '',
        spec_json: JSON.stringify(spec.spec, null, 2),
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Studio', href: '/studio' },
            { title: 'Specs', href: '/studio/specs' },
            { title: spec.title, href: `/studio/specs/${spec.slug}` },
        ],
    });

    function saveSpec() {
        try {
            const parsed = JSON.parse(form.data.spec_json) as Record<
                string,
                unknown
            >;
            setJsonError(null);
            router.put(`/studio/specs/${spec.slug}`, {
                title: form.data.title,
                episode_slug: form.data.episode_slug,
                spec: parsed as never,
            });
        } catch {
            setJsonError('Invalid JSON');
        }
    }

    return (
        <>
            <Head title={spec.title} />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-background px-2">
                    <span className="truncate text-xs font-semibold">
                        {form.data.title || spec.title}
                    </span>
                    <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px]"
                    >
                        v{spec.version}
                    </Badge>
                    <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px]"
                    >
                        {runs.length} runs
                    </Badge>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            onClick={saveSpec}
                        >
                            <Save className="size-3" />
                            Save
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                                router.post(
                                    `/studio/specs/${spec.slug}/runs`,
                                )
                            }
                        >
                            <Play className="size-3" />
                            Start run
                        </Button>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_16rem]">
                    <section className="flex min-h-0 flex-col overflow-hidden border-r">
                        <div className="grid shrink-0 gap-1.5 border-b p-2 sm:grid-cols-2">
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Title</Label>
                                <Input
                                    className="h-7 text-xs"
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData('title', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">
                                    Episode slug
                                </Label>
                                <Input
                                    className="h-7 font-mono text-xs"
                                    value={form.data.episode_slug}
                                    onChange={(e) =>
                                        form.setData(
                                            'episode_slug',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col p-2">
                            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>Production spec JSON</span>
                                {jsonError ? (
                                    <span className="text-destructive">
                                        {jsonError}
                                    </span>
                                ) : null}
                            </div>
                            <textarea
                                value={form.data.spec_json}
                                onChange={(e) =>
                                    form.setData('spec_json', e.target.value)
                                }
                                spellCheck={false}
                                className="min-h-0 flex-1 resize-none rounded border bg-background p-2 font-mono text-[11px] leading-relaxed focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            />
                        </div>
                    </section>

                    <aside className="flex min-h-0 flex-col overflow-hidden bg-background">
                        <div className="flex h-8 shrink-0 items-center border-b px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Runs
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto p-1.5">
                            {runs.length === 0 ? (
                                <p className="px-1 py-2 text-[11px] text-muted-foreground">
                                    No runs yet. Start one from the toolbar.
                                </p>
                            ) : (
                                <ul className="space-y-0.5">
                                    {runs.map((run) => (
                                        <li key={run.id}>
                                            <Link
                                                href={`/studio/runs/${run.id}`}
                                                className="block rounded border px-2 py-1.5 hover:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-medium">
                                                        #{run.id}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'text-[10px] capitalize',
                                                            statusTone(
                                                                run.status,
                                                            ),
                                                        )}
                                                    >
                                                        {run.status.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                </div>
                                                {run.currentStage ? (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {run.currentStage}
                                                    </p>
                                                ) : null}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {spec.episodeSlug ? (
                            <div className="shrink-0 border-t p-1.5 text-[11px]">
                                <Link
                                    href={`/studio/episodes/${spec.episodeSlug}`}
                                    className="block rounded px-1.5 py-1 hover:bg-muted"
                                >
                                    Episode hub →
                                </Link>
                            </div>
                        ) : null}
                    </aside>
                </div>
            </div>
        </>
    );
}
