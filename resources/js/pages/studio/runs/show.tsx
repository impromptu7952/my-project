import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    RefreshCw,
    Upload,
    XCircle,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

function qualityFailed(run: Props['run']): boolean {
    return run.artifacts.some(
        (a) =>
            a.kind === 'quality_report' &&
            typeof a.payload === 'object' &&
            a.payload !== null &&
            'passed' in a.payload &&
            (a.payload as { passed?: boolean }).passed === false,
    );
}

export default function StudioRunShow({ run }: Props) {
    const failedQuality = qualityFailed(run);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Studio', href: '/studio' },
            ...(run.spec.slug
                ? [
                      {
                          title: run.spec.title ?? 'Spec',
                          href: `/studio/specs/${run.spec.slug}`,
                      },
                  ]
                : []),
            {
                title: `Run #${run.id}`,
                href: `/studio/runs/${run.id}`,
            },
        ],
    });

    return (
        <>
            <Head title={`Run #${run.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="space-y-3">
                    {run.spec.slug ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="-ml-2 w-fit"
                        >
                            <Link href={`/studio/specs/${run.spec.slug}`}>
                                <ArrowLeft />
                                {run.spec.title ?? 'Back to spec'}
                            </Link>
                        </Button>
                    ) : null}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <Heading
                                title={`Run #${run.id}`}
                                description={
                                    run.spec.episodeSlug
                                        ? `Episode · ${run.spec.episodeSlug}`
                                        : 'Production run'
                                }
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={statusVariant(run.status)}>
                                    {run.status.replaceAll('_', ' ')}
                                </Badge>
                                {run.currentStage ? (
                                    <Badge variant="outline">
                                        Stage · {run.currentStage}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {run.error ? (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>Run error</AlertTitle>
                        <AlertDescription>{run.error}</AlertDescription>
                    </Alert>
                ) : null}

                {failedQuality ? (
                    <Alert variant="destructive">
                        <XCircle />
                        <AlertTitle>Quality checks failed</AlertTitle>
                        <AlertDescription>
                            Deterministic quality checks failed — final approve
                            is blocked until the package is fixed and re-run.
                        </AlertDescription>
                    </Alert>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>Review actions</CardTitle>
                        <CardDescription>
                            Approve or reject at human gates. Rejected runs are
                            terminal; start a new run to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {run.status === 'awaiting_script_review' ? (
                            <>
                                <Button
                                    onClick={() =>
                                        router.post(
                                            `/studio/runs/${run.id}/approve`,
                                            { gate: 'script' },
                                        )
                                    }
                                >
                                    <CheckCircle2 />
                                    Approve script
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        router.post(
                                            `/studio/runs/${run.id}/reject`,
                                            { reason: 'Needs rewrite' },
                                        )
                                    }
                                >
                                    <XCircle />
                                    Reject
                                </Button>
                            </>
                        ) : null}

                        {run.status === 'awaiting_final_review' ? (
                            <>
                                <Button
                                    disabled={failedQuality}
                                    onClick={() =>
                                        router.post(
                                            `/studio/runs/${run.id}/approve`,
                                            { gate: 'final' },
                                        )
                                    }
                                >
                                    <CheckCircle2 />
                                    Approve final
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        router.post(
                                            `/studio/runs/${run.id}/reject`,
                                        )
                                    }
                                >
                                    <XCircle />
                                    Reject
                                </Button>
                            </>
                        ) : null}

                        {run.status === 'failed' ? (
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    router.post(
                                        `/studio/runs/${run.id}/retry`,
                                        { chain: 'a' },
                                    )
                                }
                            >
                                <RefreshCw />
                                Retry chain A
                            </Button>
                        ) : null}

                        {run.status === 'approved' && run.spec.episodeSlug ? (
                            <Button
                                onClick={() =>
                                    router.post(
                                        `/studio/runs/${run.id}/publish`,
                                        {
                                            episode_slug: run.spec.episodeSlug,
                                        },
                                    )
                                }
                            >
                                <Upload />
                                Publish episode
                            </Button>
                        ) : null}

                        {!['awaiting_script_review', 'awaiting_final_review', 'failed', 'approved'].includes(
                            run.status,
                        ) ? (
                            <p className="text-sm text-muted-foreground">
                                No actions available in this status. Wait for
                                agents or refresh the page.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Artifacts</CardTitle>
                        <CardDescription>
                            Script, storyboard, prompts, and quality reports
                            produced by the pipeline.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {run.artifacts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No artifacts yet.
                            </p>
                        ) : (
                            run.artifacts.map((artifact, index) => (
                                <div key={artifact.id}>
                                    {index > 0 ? (
                                        <Separator className="my-3" />
                                    ) : null}
                                    <Collapsible>
                                        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/60">
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {artifact.kind}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    v{artifact.version}
                                                    {artifact.stage
                                                        ? ` · ${artifact.stage}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <Badge variant="outline">View</Badge>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <pre
                                                className={cn(
                                                    'mt-2 max-h-80 overflow-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs',
                                                    'dark:bg-muted/30',
                                                )}
                                            >
                                                {JSON.stringify(
                                                    artifact.payload,
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

