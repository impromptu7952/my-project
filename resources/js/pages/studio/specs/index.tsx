import { Head, Link } from '@inertiajs/react';
import { Clapperboard, Plus } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Production specs"
                        description="Define episode production packages, start agent runs, and review outputs."
                    />
                    <Button asChild>
                        <Link href="/studio/specs/create">
                            <Plus />
                            New spec
                        </Link>
                    </Button>
                </div>

                {specs.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clapperboard className="size-4 text-muted-foreground" />
                                No specs yet
                            </CardTitle>
                            <CardDescription>
                                Create a production spec to generate scripts,
                                storyboards, and review packages for an episode.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary">
                                <Link href="/studio/specs/create">
                                    <Plus />
                                    Create your first spec
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {specs.map((spec) => (
                            <Link
                                key={spec.id}
                                href={`/studio/specs/${spec.slug}`}
                                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Card className="transition-colors group-hover:bg-muted/40">
                                    <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                                        <div className="space-y-1.5">
                                            <CardTitle className="text-base">
                                                {spec.title}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs">
                                                {spec.episodeSlug ?? 'No episode slug'}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary">
                                            {spec.runsCount}{' '}
                                            {spec.runsCount === 1 ? 'run' : 'runs'}
                                        </Badge>
                                    </CardHeader>
                                    {spec.updatedAt ? (
                                        <>
                                            <Separator />
                                            <CardContent className="pt-0 text-xs text-muted-foreground">
                                                Updated{' '}
                                                {new Date(
                                                    spec.updatedAt,
                                                ).toLocaleString()}
                                            </CardContent>
                                        </>
                                    ) : null}
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

StudioSpecsIndex.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'Production specs', href: '/studio' },
    ],
};
