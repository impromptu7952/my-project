import { Head, Link } from '@inertiajs/react';
import { Clapperboard, Film } from 'lucide-react';
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

type EpisodeRow = {
    id: number;
    slug: string;
    title: string;
    status: string;
    topicName: string | null;
    hasVideoMaster: boolean;
    durationSeconds: number | null;
    updatedAt: string | null;
    publicHref: string | null;
};

type SpecRow = {
    slug: string;
    title: string;
    episodeSlug: string | null;
};

type Props = {
    episodes: EpisodeRow[];
    specs: SpecRow[];
};

export default function StudioEpisodesIndex({ episodes, specs }: Props) {
    return (
        <>
            <Head title="Studio — Episodes" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-x-auto p-2 md:p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Episodes"
                        description="Catalog, media, and production links for every episode."
                    />
                    <Button asChild variant="secondary">
                        <Link href="/studio">
                            <Clapperboard />
                            Specs
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Film className="size-4" />
                            Episode library
                        </CardTitle>
                        <CardDescription>
                            Open an episode to upload masters and jump into
                            production specs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {episodes.map((ep) => (
                            <Link
                                key={ep.id}
                                href={`/studio/episodes/${ep.slug}`}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {ep.title}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {ep.topicName ?? '—'} · {ep.slug}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    <Badge
                                        variant={
                                            ep.status === 'published'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {ep.status}
                                    </Badge>
                                    <Badge
                                        variant={
                                            ep.hasVideoMaster
                                                ? 'outline'
                                                : 'destructive'
                                        }
                                    >
                                        {ep.hasVideoMaster
                                            ? 'has master'
                                            : 'no master'}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                        {episodes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No episodes yet. Seed content or create via
                                database.
                            </p>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Recent production specs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {specs.map((s) => (
                            <Button key={s.slug} asChild variant="outline" size="sm">
                                <Link href={`/studio/specs/${s.slug}`}>
                                    {s.title}
                                </Link>
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StudioEpisodesIndex.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'Episodes', href: '/studio/episodes' },
    ],
};
