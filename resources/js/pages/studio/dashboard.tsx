import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Bot,
    Clapperboard,
    Film,
    PlayCircle,
    Sparkles,
} from 'lucide-react';
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

type Props = {
    stats: {
        specs: number;
        runs: number;
        awaitingReview: number;
        publishedEpisodes: number;
        draftEpisodes: number;
        agentProfiles: number;
    };
    recentRuns: Array<{
        id: number;
        status: string;
        currentStage: string | null;
        specTitle: string | null;
        specSlug: string | null;
        episodeSlug: string | null;
        href: string;
        updatedAt: string | null;
    }>;
    needsAttention: Array<{
        id: number;
        status: string;
        specTitle: string | null;
        href: string;
    }>;
    xaiConfigured: boolean;
    character?: {
        name: string | null;
        ageTarget: string | null;
        href: string;
    } | null;
};

export default function StudioDashboard({
    stats,
    recentRuns,
    needsAttention,
    xaiConfigured,
    character = null,
}: Props) {
    return (
        <>
            <Head title="Studio" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-x-auto p-2 md:p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Studio overview"
                        description="Production pipeline for Albanian toddler episodes — specs, runs, agents, and media."
                    />
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={xaiConfigured ? 'default' : 'secondary'}>
                            <Sparkles className="size-3" />
                            {xaiConfigured ? 'Grok connected' : 'Stub agents'}
                        </Badge>
                        {character?.href ? (
                            <Button asChild size="sm" variant="outline">
                                <Link href={character.href}>
                                    {character.name ?? 'Brand'} bible
                                </Link>
                            </Button>
                        ) : null}
                        <Button asChild size="sm">
                            <Link href="/studio/specs/create">New spec</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                        {
                            label: 'Production specs',
                            value: stats.specs,
                            href: '/studio/specs',
                            icon: Clapperboard,
                        },
                        {
                            label: 'Runs awaiting review',
                            value: stats.awaitingReview,
                            href: '/studio',
                            icon: AlertTriangle,
                        },
                        {
                            label: 'Total runs',
                            value: stats.runs,
                            href: '/studio',
                            icon: PlayCircle,
                        },
                        {
                            label: 'Published episodes',
                            value: stats.publishedEpisodes,
                            href: '/studio/episodes',
                            icon: Film,
                        },
                        {
                            label: 'Draft episodes',
                            value: stats.draftEpisodes,
                            href: '/studio/episodes',
                            icon: Film,
                        },
                        {
                            label: 'Active agents',
                            value: stats.agentProfiles,
                            href: '/studio/agents',
                            icon: Bot,
                        },
                    ].map((stat) => (
                        <Link key={stat.label} href={stat.href}>
                            <Card className="h-full transition-colors hover:bg-muted/40">
                                <CardHeader className="pb-2">
                                    <CardDescription className="flex items-center gap-2">
                                        <stat.icon className="size-3.5" />
                                        {stat.label}
                                    </CardDescription>
                                    <CardTitle className="text-2xl tabular-nums">
                                        {stat.value}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Needs attention
                            </CardTitle>
                            <CardDescription>
                                Script/final review gates and failed runs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {needsAttention.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nothing waiting — start a new production run.
                                </p>
                            ) : (
                                needsAttention.map((run) => (
                                    <Link
                                        key={run.id}
                                        href={run.href}
                                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                                    >
                                        <span className="truncate font-medium">
                                            #{run.id} · {run.specTitle ?? 'Run'}
                                        </span>
                                        <Badge variant="secondary">
                                            {run.status.replaceAll('_', ' ')}
                                        </Badge>
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Recent runs
                            </CardTitle>
                            <CardDescription>
                                Jump back into any production workspace.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {recentRuns.map((run) => (
                                <Link
                                    key={run.id}
                                    href={run.href}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            #{run.id} · {run.specTitle}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {run.episodeSlug ?? '—'}
                                            {run.currentStage
                                                ? ` · ${run.currentStage}`
                                                : ''}
                                        </p>
                                    </div>
                                    <Badge variant="outline">
                                        {run.status.replaceAll('_', ' ')}
                                    </Badge>
                                </Link>
                            ))}
                            {recentRuns.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No runs yet.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href="/studio/specs">All specs</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/studio/episodes">Episodes</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/studio/agents">Agents</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/videos">Public videos</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

StudioDashboard.layout = {
    breadcrumbs: [{ title: 'Studio', href: '/studio' }],
};
