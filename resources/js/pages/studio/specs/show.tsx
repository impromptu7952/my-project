import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import { ArrowLeft, Play, Save } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

function statusVariant(
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status.includes('failed') || status.includes('rejected')) {
        return 'destructive';
    }
    if (status.includes('approved') || status.includes('published')) {
        return 'default';
    }
    if (status.includes('awaiting')) {
        return 'secondary';
    }

    return 'outline';
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
            setJsonError('Spec JSON is invalid.');
        }
    }

    return (
        <>
            <Head title={spec.title} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="space-y-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="-ml-2 w-fit"
                    >
                        <Link href="/studio/specs">
                            <ArrowLeft />
                            Back to specs
                        </Link>
                    </Button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <Heading
                                title={spec.title}
                                description={
                                    spec.episodeSlug
                                        ? `Episode · ${spec.episodeSlug}`
                                        : 'No episode linked'
                                }
                            />
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">v{spec.version}</Badge>
                                <Badge variant="secondary">
                                    {runs.length}{' '}
                                    {runs.length === 1 ? 'run' : 'runs'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" onClick={saveSpec}>
                                <Save />
                                Save spec
                            </Button>
                            <Button
                                onClick={() =>
                                    router.post(
                                        `/studio/specs/${spec.slug}/runs`,
                                    )
                                }
                            >
                                <Play />
                                Start production run
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="min-w-0">
                        <CardHeader>
                            <CardTitle>Spec package</CardTitle>
                            <CardDescription>
                                Edit the production brief agents consume. JSON
                                is validated on save.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData('title', e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="episode_slug">
                                    Episode slug
                                </Label>
                                <Input
                                    id="episode_slug"
                                    className="font-mono text-sm"
                                    value={form.data.episode_slug}
                                    onChange={(e) =>
                                        form.setData(
                                            'episode_slug',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="spec_json">Spec JSON</Label>
                                <textarea
                                    id="spec_json"
                                    value={form.data.spec_json}
                                    onChange={(e) =>
                                        form.setData(
                                            'spec_json',
                                            e.target.value,
                                        )
                                    }
                                    className={cn(
                                        'min-h-[22rem] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs',
                                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    )}
                                    spellCheck={false}
                                />
                                {jsonError ? (
                                    <p className="text-sm text-destructive">
                                        {jsonError}
                                    </p>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Production runs</CardTitle>
                            <CardDescription>
                                Human gates pause after script and final package
                                review. Open a run for the full step workspace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {runs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No runs yet. Start a production run to
                                    generate artifacts.
                                </p>
                            ) : (
                                runs.map((run, index) => (
                                    <div key={run.id}>
                                        {index > 0 ? (
                                            <Separator className="my-2" />
                                        ) : null}
                                        <Link
                                            href={`/studio/runs/${run.id}`}
                                            className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted/60"
                                        >
                                            <div className="min-w-0 space-y-1">
                                                <p className="font-medium">
                                                    Run #{run.id}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    Stage:{' '}
                                                    {run.currentStage ?? '—'}
                                                    {run.startedAt
                                                        ? ` · ${new Date(run.startedAt).toLocaleString()}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={statusVariant(
                                                    run.status,
                                                )}
                                                className="shrink-0"
                                            >
                                                {run.status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </Badge>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
