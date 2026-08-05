import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { EpisodeMediaPanel } from '@/components/studio/episode-media-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-background px-2">
                    <span className="truncate text-xs font-semibold">
                        {episode.title}
                    </span>
                    <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] capitalize"
                    >
                        {episode.status}
                    </Badge>
                    {episode.ageBand ? (
                        <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px]"
                        >
                            {episode.ageBand}
                        </Badge>
                    ) : null}
                    <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
                        {episode.topicName} · {episode.slug}
                    </span>
                    <div className="ml-auto">
                        {episode.publicHref ? (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                            >
                                <a
                                    href={episode.publicHref}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink className="size-3" />
                                    Public
                                </a>
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-2">
                    <section className="min-h-0 overflow-auto border-r p-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Media
                        </p>
                        <EpisodeMediaPanel
                            episodeSlug={episode.slug}
                            media={media}
                        />
                        {(episode.summarySq || episode.summaryEn) && (
                            <div className="mt-3 space-y-1 rounded border p-2 text-[11px]">
                                {episode.summarySq ? (
                                    <p>
                                        <span className="text-muted-foreground">
                                            SQ ·{' '}
                                        </span>
                                        {episode.summarySq}
                                    </p>
                                ) : null}
                                {episode.summaryEn ? (
                                    <p>
                                        <span className="text-muted-foreground">
                                            EN ·{' '}
                                        </span>
                                        {episode.summaryEn}
                                    </p>
                                ) : null}
                            </div>
                        )}
                    </section>

                    <section className="min-h-0 overflow-auto p-2">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Linked specs
                        </p>
                        {specs.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">
                                No production specs for this episode yet.
                            </p>
                        ) : (
                            <ul className="space-y-0.5">
                                {specs.map((s) => (
                                    <li key={s.slug}>
                                        <Link
                                            href={s.href}
                                            className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs hover:bg-muted/50"
                                        >
                                            <span className="truncate font-medium">
                                                {s.title}
                                            </span>
                                            <span className="shrink-0 text-[10px] text-muted-foreground">
                                                {s.runsCount} runs
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
