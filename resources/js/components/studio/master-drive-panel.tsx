import { router } from '@inertiajs/react';
import { Clapperboard, Sparkles, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TextModelOption = {
    id: string;
    label: string;
    hint?: string;
};

export type VideoModelOption = {
    id: string;
    label: string;
    hint?: string;
    usdPerSec: number;
    durationOptions?: Array<{ seconds: number; estimatedUsd: number }>;
};

export type MasterDriveInfo = {
    xaiConfigured: boolean;
    imagineConfigured: boolean;
    ffmpegAvailable: boolean;
    textModel?: string;
    videoModel?: string;
    textModels?: TextModelOption[];
    videoModels?: VideoModelOption[];
    resolution?: string;
    usdPerSec?: number;
    defaultDuration?: number;
    minDuration?: number;
    maxDuration?: number;
    durationOptions?: Array<{ seconds: number; estimatedUsd: number }>;
    last?: {
        method?: string;
        at?: string;
        cards?: number;
        duration_seconds?: number;
        prompt_preview?: string;
        media_asset_id?: number;
        estimated_usd?: number;
        model?: string;
    } | null;
};

type Props = {
    runId: number;
    masterDrive: MasterDriveInfo;
    hasEpisode: boolean;
    onDone?: () => void;
    className?: string;
};

function formatUsd(n: number): string {
    return `$${n.toFixed(2)}`;
}

export function MasterDrivePanel({
    runId,
    masterDrive,
    hasEpisode,
    onDone,
    className,
}: Props) {
    const [busy, setBusy] = useState<'assemble' | 'imagine' | 'models' | null>(
        null,
    );
    const defaultDuration = masterDrive.defaultDuration ?? 3;
    const [duration, setDuration] = useState(defaultDuration);
    const [textModel, setTextModel] = useState(
        masterDrive.textModel ?? 'grok-4.3',
    );
    const [videoModel, setVideoModel] = useState(
        masterDrive.videoModel ?? 'grok-imagine-video',
    );

    const textModels = masterDrive.textModels ?? [];
    const videoModels = masterDrive.videoModels ?? [];

    const activeVideo = useMemo(
        () => videoModels.find((m) => m.id === videoModel),
        [videoModels, videoModel],
    );

    const usdPerSec =
        activeVideo?.usdPerSec ?? masterDrive.usdPerSec ?? 0.05;

    const options = useMemo(() => {
        if (activeVideo?.durationOptions?.length) {
            return activeVideo.durationOptions;
        }
        if (masterDrive.durationOptions?.length && !activeVideo) {
            return masterDrive.durationOptions;
        }
        const min = masterDrive.minDuration ?? 3;
        const max = masterDrive.maxDuration ?? 6;
        const list = [];
        for (let s = min; s <= max; s++) {
            list.push({ seconds: s, estimatedUsd: round3(s * usdPerSec) });
        }
        return list;
    }, [activeVideo, masterDrive, usdPerSec]);

    const estimate =
        options.find((o) => o.seconds === duration)?.estimatedUsd ??
        round3(duration * usdPerSec);

    function persistModels(next: {
        text_model?: string;
        video_model?: string;
    }) {
        setBusy('models');
        router.put(
            `/studio/runs/${runId}/models`,
            next,
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
            },
        );
    }

    function onTextModelChange(id: string) {
        setTextModel(id);
        persistModels({ text_model: id, video_model: videoModel });
    }

    function onVideoModelChange(id: string) {
        setVideoModel(id);
        persistModels({ text_model: textModel, video_model: id });
    }

    function assemble() {
        setBusy('assemble');
        router.post(
            `/studio/runs/${runId}/assemble-preview`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
                onSuccess: () => onDone?.(),
            },
        );
    }

    function imagine() {
        const ok = window.confirm(
            [
                `Generate Imagine video?`,
                ``,
                `Model: ${videoModel}`,
                `Duration: ${duration}s · ${masterDrive.resolution ?? '480p'}`,
                `Est. cost: ~${formatUsd(estimate)} (billed per second on XAI_API_KEY)`,
                ``,
                `Tip: use Assemble (free) for iteration. Use Imagine sparingly.`,
            ].join('\n'),
        );
        if (!ok) {
            return;
        }
        setBusy('imagine');
        router.post(
            `/studio/runs/${runId}/imagine-master`,
            { duration, model: videoModel },
            {
                preserveScroll: true,
                onFinish: () => setBusy(null),
                onSuccess: () => onDone?.(),
            },
        );
    }

    const last = masterDrive.last;

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-1.5">
                <Clapperboard className="size-3.5 text-muted-foreground" />
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Drive program master
                </p>
            </div>

            <p className="text-[11px] leading-snug text-muted-foreground">
                Prefer <strong className="text-foreground">Assemble</strong> while
                building (free). Imagine is metered API usage — shorter clips =
                lower cost.
            </p>

            {/* Model pickers */}
            <div className="grid gap-1.5 rounded-md border bg-muted/20 p-2">
                <div className="space-y-0.5">
                    <label
                        htmlFor={`text-model-${runId}`}
                        className="text-[10px] font-medium text-muted-foreground"
                    >
                        Package text model (Laravel AI · xAI)
                    </label>
                    <select
                        id={`text-model-${runId}`}
                        value={textModel}
                        disabled={busy !== null || textModels.length === 0}
                        onChange={(e) => onTextModelChange(e.target.value)}
                        className="h-7 w-full rounded border bg-background px-1.5 font-mono text-[11px]"
                    >
                        {textModels.length === 0 ? (
                            <option value={textModel}>{textModel}</option>
                        ) : (
                            textModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.label}
                                    {m.hint ? ` — ${m.hint}` : ''}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div className="space-y-0.5">
                    <label
                        htmlFor={`video-model-${runId}`}
                        className="text-[10px] font-medium text-muted-foreground"
                    >
                        Imagine video model
                    </label>
                    <select
                        id={`video-model-${runId}`}
                        value={videoModel}
                        disabled={busy !== null || videoModels.length === 0}
                        onChange={(e) => onVideoModelChange(e.target.value)}
                        className="h-7 w-full rounded border bg-background px-1.5 font-mono text-[11px]"
                    >
                        {videoModels.length === 0 ? (
                            <option value={videoModel}>{videoModel}</option>
                        ) : (
                            videoModels.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.label}
                                    {m.hint ? ` — ${m.hint}` : ''}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {!hasEpisode ? (
                <p className="rounded border border-dashed px-2 py-1.5 text-[11px] text-muted-foreground">
                    Link an episode_slug on the production spec first.
                </p>
            ) : (
                <div className="grid gap-1.5">
                    <button
                        type="button"
                        disabled={!masterDrive.ffmpegAvailable || busy !== null}
                        onClick={assemble}
                        className={cn(
                            'rounded-md border p-2 text-left transition-colors',
                            'hover:bg-muted/50 disabled:opacity-50',
                            busy === 'assemble' && 'ring-1 ring-primary',
                        )}
                    >
                        <div className="flex items-center gap-1.5">
                            <Wrench className="size-3.5" />
                            <span className="text-xs font-semibold">
                                A · Assemble local preview
                            </span>
                            <Badge
                                variant="secondary"
                                className="ml-auto h-4 px-1 text-[9px]"
                            >
                                free
                            </Badge>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Script/VTT → card film (ffmpeg). Best for daily
                            iteration.
                            {!masterDrive.ffmpegAvailable
                                ? ' · ffmpeg missing'
                                : ''}
                            {busy === 'assemble' ? ' · building…' : ''}
                        </p>
                    </button>

                    <div
                        className={cn(
                            'rounded-md border p-2',
                            !masterDrive.imagineConfigured && 'opacity-60',
                        )}
                    >
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5" />
                            <span className="text-xs font-semibold">
                                B · Generate with Imagine
                            </span>
                            <Badge
                                variant="outline"
                                className="ml-auto h-4 px-1 text-[9px]"
                            >
                                ~{formatUsd(estimate)}
                            </Badge>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            <span className="font-mono">{videoModel}</span>
                            {' · '}
                            {masterDrive.resolution ?? '480p'} · ~
                            {usdPerSec}/s
                            {!masterDrive.imagineConfigured
                                ? ' · key not set'
                                : ''}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                                Length
                            </span>
                            {options.map((opt) => (
                                <button
                                    key={opt.seconds}
                                    type="button"
                                    disabled={
                                        !masterDrive.imagineConfigured ||
                                        busy !== null
                                    }
                                    onClick={() => setDuration(opt.seconds)}
                                    className={cn(
                                        'rounded border px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
                                        duration === opt.seconds
                                            ? 'border-primary bg-primary/10 text-foreground'
                                            : 'text-muted-foreground hover:bg-muted/50',
                                    )}
                                >
                                    {opt.seconds}s · {formatUsd(opt.estimatedUsd)}
                                </button>
                            ))}
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            className="mt-2 h-7 w-full text-[11px]"
                            disabled={
                                !masterDrive.imagineConfigured || busy !== null
                            }
                            onClick={imagine}
                        >
                            <Sparkles className="size-3" />
                            {busy === 'imagine'
                                ? 'Generating…'
                                : `Generate ${duration}s (~${formatUsd(estimate)})`}
                        </Button>
                    </div>
                </div>
            )}

            {last?.method ? (
                <p className="text-[10px] text-muted-foreground">
                    Last:{' '}
                    <span className="font-medium text-foreground">
                        {last.method}
                    </span>
                    {last.cards != null ? ` · ${last.cards} cards` : ''}
                    {last.duration_seconds != null
                        ? ` · ${last.duration_seconds}s`
                        : ''}
                    {last.estimated_usd != null
                        ? ` · ~${formatUsd(last.estimated_usd)}`
                        : ''}
                    {last.model ? ` · ${last.model}` : ''}
                    {last.at
                        ? ` · ${new Date(last.at).toLocaleString()}`
                        : ''}
                </p>
            ) : null}

            <div className="flex gap-1">
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 flex-1 text-[11px]"
                    disabled={
                        !hasEpisode ||
                        !masterDrive.ffmpegAvailable ||
                        busy !== null
                    }
                    onClick={assemble}
                >
                    <Wrench className="size-3" />
                    Assemble free
                </Button>
            </div>
        </div>
    );
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}
