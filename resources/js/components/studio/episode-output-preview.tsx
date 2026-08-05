import { Link, router } from '@inertiajs/react';
import { ExternalLink, Film, RefreshCw, Subtitles } from 'lucide-react';
import { useMemo } from 'react';
import {
    extractVttFromPayload,
    StudioPlayer,
} from '@/components/studio/studio-player';
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
    scriptLines?: string[];
    onScreenLabels?: Array<{ text?: string; timecode?: string }>;
    /** Live VTT from draft editor (overrides package when set). */
    livePackageVtt?: string | null;
    mode?: 'dock' | 'full';
    className?: string;
    /** Prefer package/live VTT over media captions for live package preview. */
    preferPackageCaptions?: boolean;
};

function extractScriptLines(scriptPayload: unknown): string[] {
    if (!scriptPayload || typeof scriptPayload !== 'object') {
        return [];
    }
    const sections = (
        scriptPayload as { sections?: Array<{ dialogue?: string[] }> }
    ).sections;
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

export { extractVttFromPayload };

export function EpisodeOutputPreview({
    episode,
    scriptLines = [],
    onScreenLabels = [],
    livePackageVtt = null,
    mode = 'full',
    className,
    preferPackageCaptions = false,
}: Props) {
    const isDock = mode === 'dock';

    const effectiveVtt = useMemo(() => {
        if (livePackageVtt && livePackageVtt.includes('WEBVTT')) {
            return livePackageVtt;
        }
        return episode?.packageVtt ?? null;
    }, [livePackageVtt, episode?.packageVtt]);

    const captionSource = useMemo(() => {
        if (livePackageVtt && livePackageVtt.includes('WEBVTT')) {
            return 'live';
        }
        if (preferPackageCaptions && effectiveVtt) {
            return 'package';
        }
        if (episode?.playback.hasCaptions) {
            return 'media';
        }
        if (effectiveVtt) {
            return 'package';
        }
        return 'none';
    }, [
        livePackageVtt,
        preferPackageCaptions,
        effectiveVtt,
        episode?.playback.hasCaptions,
    ]);

    const usePackageTrack =
        preferPackageCaptions ||
        captionSource === 'live' ||
        captionSource === 'package' ||
        !episode?.playback.hasCaptions;

    function refreshMedia() {
        router.reload({
            only: ['episodePreview', 'episodeMedia', 'run', 'publishChecklist'],
        });
    }

    if (!episode) {
        return (
            <div
                className={cn(
                    'flex h-full items-center gap-2 rounded border border-dashed px-3 text-[11px] text-muted-foreground',
                    className,
                )}
            >
                <Film className="size-3.5 shrink-0" />
                Link an episode_slug on the production spec to preview the final
                watch experience here.
            </div>
        );
    }

    const header = (
        <div
            className={cn(
                'flex shrink-0 flex-wrap items-center gap-1.5',
                isDock && 'gap-1',
            )}
        >
            <span className="truncate text-xs font-semibold">
                {episode.title}
            </span>
            {!isDock ? (
                <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[10px] capitalize"
                >
                    {episode.status}
                </Badge>
            ) : null}
            <Badge
                variant="outline"
                className="h-5 gap-0.5 px-1.5 text-[10px]"
            >
                <Subtitles className="size-3" />
                {captionSource === 'live'
                    ? 'Live package VTT'
                    : captionSource === 'media'
                      ? 'Episode VTT'
                      : captionSource === 'package'
                        ? 'Package VTT'
                        : 'No captions'}
            </Badge>
            <div className="ml-auto flex items-center gap-0.5">
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={refreshMedia}
                    title="Reload episode media & package captions"
                >
                    <RefreshCw className="size-3" />
                    {!isDock ? 'Refresh' : null}
                </Button>
                {!isDock ? (
                    <>
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
                    </>
                ) : null}
            </div>
        </div>
    );

    const player =
        episode.playback.hasVideo && episode.playback.src ? (
            <StudioPlayer
                src={episode.playback.src}
                poster={episode.playback.poster}
                captionsSrc={
                    usePackageTrack ? null : episode.playback.captionsSrc
                }
                packageVtt={effectiveVtt}
                preferPackageVtt={usePackageTrack}
                title={episode.title}
                mimeType={episode.playback.mimeType}
                captionsLang={episode.playback.language}
                dense
                fill={isDock}
            />
        ) : (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 text-center',
                    isDock ? 'h-full min-h-0' : 'aspect-video',
                )}
            >
                <Film className="size-6 text-muted-foreground" />
                <p className="text-xs font-medium">No video master yet</p>
                <p className="max-w-xs text-[10px] text-muted-foreground">
                    Upload a master in Media, or keep editing the package
                    read-along.
                </p>
            </div>
        );

    if (isDock) {
        // Dock: fill parent height, no scrollbars. Video + slim cue column.
        const cuePreview = scriptLines.slice(0, 5);

        return (
            <div
                className={cn(
                    'flex h-full min-h-0 flex-col gap-1 overflow-hidden',
                    className,
                )}
            >
                {header}
                <p className="shrink-0 truncate text-[9px] text-muted-foreground">
                    Master file is fixed until re-upload · package cues/VTT
                    update with stages · not a re-render of the MP4
                </p>
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-[minmax(0,1fr)_11rem]">
                    <div className="min-h-0 min-w-0 overflow-hidden">
                        {player}
                    </div>
                    <div className="hidden min-h-0 flex-col overflow-hidden rounded-md border bg-muted/20 sm:flex">
                        <div className="shrink-0 border-b px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Package cues
                        </div>
                        <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden p-1">
                            {onScreenLabels.slice(0, 3).map((row, i) => (
                                <p
                                    key={`os-${i}`}
                                    className="truncate text-[10px] font-medium text-primary"
                                >
                                    {row.text}
                                </p>
                            ))}
                            {cuePreview.length > 0 ? (
                                cuePreview.map((line, i) => (
                                    <p
                                        key={i}
                                        className="line-clamp-2 text-[10px] leading-snug text-muted-foreground"
                                    >
                                        {line}
                                    </p>
                                ))
                            ) : (
                                <p className="text-[10px] text-muted-foreground">
                                    No script lines
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Full Output tab
    return (
        <div
            className={cn('flex h-full min-h-0 flex-col gap-2', className)}
        >
            {header}
            <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                    <div className="min-h-0 flex-1 overflow-hidden">
                        {episode.playback.hasVideo && episode.playback.src ? (
                            <StudioPlayer
                                src={episode.playback.src}
                                poster={episode.playback.poster}
                                captionsSrc={
                                    usePackageTrack
                                        ? null
                                        : episode.playback.captionsSrc
                                }
                                packageVtt={effectiveVtt}
                                preferPackageVtt={usePackageTrack}
                                title={episode.title}
                                mimeType={episode.playback.mimeType}
                                captionsLang={episode.playback.language}
                                dense
                                fill
                            />
                        ) : (
                            player
                        )}
                    </div>
                    {episode.playback.videoUpdatedAt ? (
                        <p className="mt-1 shrink-0 text-[10px] text-muted-foreground">
                            Master updated{' '}
                            {new Date(
                                episode.playback.videoUpdatedAt,
                            ).toLocaleString()}
                        </p>
                    ) : null}
                </div>

                <div className="flex min-h-0 flex-col overflow-hidden rounded-md border bg-background">
                    <div className="shrink-0 border-b bg-muted/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Package read-along
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
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
