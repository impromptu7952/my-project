import { Link, router } from '@inertiajs/react';
import {
    ExternalLink,
    Film,
    RefreshCw,
    Subtitles,
} from 'lucide-react';
import { useMemo } from 'react';
import { StudioPlayer } from '@/components/studio/studio-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EpisodePreview = {
    slug: string;
    title: string;
    status: string;
    ageBand?: string | null;
    durationSeconds?: number | null;
    hubHref: string;
    publicHref?: string | null;
    playback: {
        provider: string;
        src: string | null;
        captionsSrc: string | null;
        poster: string | null;
        mimeType: string | null;
        language: string;
        hasVideo: boolean;
        hasCaptions: boolean;
        videoUpdatedAt?: string | null;
        cacheKey: string;
    };
    packageVtt?: string | null;
    media?: Array<{
        id: number;
        kind: string;
        mimeType: string | null;
        sizeBytes: number | null;
        url: string | null;
        updatedAt?: string | null;
    }>;
};

type Props = {
    episode: EpisodePreview | null;
    /** Script / VO lines for read-along when no video yet */
    scriptLines?: string[];
    onScreenLabels?: Array<{ text?: string; timecode?: string }>;
    /** Compact dock vs full Output tab */
    mode?: 'dock' | 'full';
    className?: string;
};

function extractScriptLines(scriptPayload: unknown): string[] {
    if (!scriptPayload || typeof scriptPayload !== 'object') {
        return [];
    }
    const sections = (scriptPayload as { sections?: Array<{ dialogue?: string[] }> })
        .sections;
    if (!Array.isArray(sections)) {
        return [];
    }
    const lines: string[] = [];
    for (const s of sections) {
        for (const line of s.dialogue ?? []) {
            if (typeof line === 'string' && line.trim()) {
                lines.push(line.trim());
            }
        }
    }
    return lines.slice(0, 24);
}

export function linesFromScriptPayload(payload: unknown): string[] {
    return extractScriptLines(payload);
}

export function EpisodeOutputPreview({
    episode,
    scriptLines = [],
    onScreenLabels = [],
    mode = 'full',
    className,
}: Props) {
    const isDock = mode === 'dock';

    const captionSource = useMemo(() => {
        if (!episode) {
            return 'none';
        }
        if (episode.playback.hasCaptions) {
            return 'media';
        }
        if (episode.packageVtt) {
            return 'package';
        }
        return 'none';
    }, [episode]);

    function refreshMedia() {
        router.reload({
            only: ['episodePreview', 'episodeMedia', 'run', 'publishChecklist'],
        });
    }

    if (!episode) {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 rounded border border-dashed px-3 py-4 text-[11px] text-muted-foreground',
                    className,
                )}
            >
                <Film className="size-3.5 shrink-0" />
                Link an episode_slug on the production spec to preview the final
                watch experience here.
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-col gap-2',
                isDock ? 'min-h-0' : 'h-full',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-semibold">
                    {episode.title}
                </span>
                <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[10px] capitalize"
                >
                    {episode.status}
                </Badge>
                {episode.ageBand ? (
                    <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px]"
                    >
                        {episode.ageBand}
                    </Badge>
                ) : null}
                <Badge
                    variant="outline"
                    className="h-5 gap-0.5 px-1.5 text-[10px]"
                >
                    <Subtitles className="size-3" />
                    {captionSource === 'media'
                        ? 'Episode VTT'
                        : captionSource === 'package'
                          ? 'Package VTT'
                          : 'No captions'}
                </Badge>
                <div className="ml-auto flex items-center gap-1">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[10px]"
                        onClick={refreshMedia}
                        title="Reload episode media & package captions"
                    >
                        <RefreshCw className="size-3" />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[10px]"
                        asChild
                    >
                        <Link href={episode.hubHref}>Hub</Link>
                    </Button>
                    {episode.publicHref ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-[10px]"
                            asChild
                        >
                            <a
                                href={episode.publicHref}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink className="size-3" />
                                Live
                            </a>
                        </Button>
                    ) : null}
                </div>
            </div>

            <div
                className={cn(
                    'grid min-h-0 gap-2',
                    isDock
                        ? 'grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'
                        : 'grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]',
                )}
            >
                <div className="min-w-0">
                    {episode.playback.hasVideo && episode.playback.src ? (
                        <StudioPlayer
                            src={episode.playback.src}
                            poster={episode.playback.poster}
                            captionsSrc={episode.playback.captionsSrc}
                            packageVtt={
                                episode.playback.hasCaptions
                                    ? null
                                    : episode.packageVtt
                            }
                            title={episode.title}
                            mimeType={episode.playback.mimeType}
                            captionsLang={episode.playback.language}
                            dense
                        />
                    ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 text-center">
                            <Film className="size-6 text-muted-foreground" />
                            <p className="text-xs font-medium">
                                No video master yet
                            </p>
                            <p className="max-w-xs text-[10px] text-muted-foreground">
                                Upload a master in Media (inspector) or publish
                                after assembly. Script read-along is shown on
                                the right.
                            </p>
                        </div>
                    )}
                    {episode.playback.videoUpdatedAt ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                            Master updated{' '}
                            {new Date(
                                episode.playback.videoUpdatedAt,
                            ).toLocaleString()}
                        </p>
                    ) : null}
                </div>

                <div
                    className={cn(
                        'min-h-0 overflow-auto rounded-md border bg-background',
                        isDock ? 'max-h-40 sm:max-h-none' : 'max-h-[28rem]',
                    )}
                >
                    <div className="sticky top-0 border-b bg-muted/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Package read-along
                    </div>
                    <div className="space-y-2 p-2">
                        {onScreenLabels.length > 0 ? (
                            <div>
                                <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">
                                    On-screen
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {onScreenLabels.map((row, i) => (
                                        <Badge
                                            key={i}
                                            variant="secondary"
                                            className="text-[10px] font-normal"
                                        >
                                            {row.timecode
                                                ? `${row.timecode} · `
                                                : ''}
                                            {row.text}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {scriptLines.length > 0 ? (
                            <ol className="space-y-1">
                                {scriptLines.map((line, i) => (
                                    <li
                                        key={i}
                                        className="rounded border bg-muted/20 px-2 py-1 text-[11px] leading-snug"
                                    >
                                        <span className="mr-1.5 font-mono text-[9px] text-muted-foreground">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        {line}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-[11px] text-muted-foreground">
                                Generate or edit the script stage to preview
                                dialogue here next to the master.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
