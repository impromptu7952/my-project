import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Heading from '@/components/heading';
import { EpisodeMediaPanel } from '@/components/studio/episode-media-panel';
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
    episode: {
        id: number;
        slug: string;
        title: string;
        titleSq: string;
        titleEn: string | null;
        summarySq: string | null;
        summaryEn: string | null;
        status: string;
        durationSeconds: number | null;
        ageBand: string | null;
        topicName: string | null;
        publicHref: string | null;
    };
    media: Array<{
        id: number;
        kind: string;
        mimeType: string | null;
        sizeBytes: number | null;
        url: string | null;
    }>;
    specs: Array<{
        slug: string;
        title: string;
        runsCount: number;
        href: string;
    }>;
};

export default function StudioEpisodeShow({ episode, media, specs }: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Studio', href: '/studio' },
            { title: 'Episodes', href: '/studio/episodes' },
            {
                title: episode.title,
                href: `/studio/episodes/${episode.slug}`,
            },
        ],
    });

    return (
        <>
            <Head title={`Studio · ${episode.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="space-y-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="-ml-2 w-fit"
                    >
                        <Link href="/studio/episodes">
                            <ArrowLeft />
                            All episodes
                        </Link>
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <Heading
                                title={episode.title}
                                description={`${episode.topicName ?? 'Topic'} · ${episode.slug}`}
                            />
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    {episode.status}
                                </Badge>
                                {episode.ageBand ? (
                                    <Badge variant="outline">
                                        {episode.ageBand}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                        {episode.publicHref ? (
                            <Button asChild variant="outline">
                                <a href={episode.publicHref} target="_blank" rel="noreferrer">
                                    <ExternalLink />
                                    Public page
                                </a>
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                            <CardDescription>
                                Titles and summaries (SQ / EN).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Title SQ
                                </p>
                                <p>{episode.titleSq}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Title EN
                                </p>
                                <p>{episode.titleEn ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Summary SQ
                                </p>
                                <p className="text-muted-foreground">
                                    {episode.summarySq ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Summary EN
                                </p>
                                <p className="text-muted-foreground">
                                    {episode.summaryEn ?? '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <EpisodeMediaPanel
                        episodeSlug={episode.slug}
                        media={media}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Production specs</CardTitle>
                        <CardDescription>
                            Specs linked by episode slug.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {specs.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    No specs for this episode yet.
                                </p>
                                <Button asChild size="sm">
                                    <Link href="/studio/specs/create">
                                        Create spec
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            specs.map((s) => (
                                <Link
                                    key={s.slug}
                                    href={s.href}
                                    className="flex items-center justify-between rounded-lg border px-3 py-3 text-sm hover:bg-muted/50"
                                >
                                    <span className="font-medium">{s.title}</span>
                                    <Badge variant="outline">
                                        {s.runsCount} runs
                                    </Badge>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
