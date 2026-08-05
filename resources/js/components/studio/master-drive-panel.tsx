import { router } from '@inertiajs/react';
import { Clapperboard, Sparkles, Wrench } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MasterDriveInfo = {
    xaiConfigured: boolean;
    imagineConfigured: boolean;
    ffmpegAvailable: boolean;
    last?: {
        method?: string;
        at?: string;
        cards?: number;
        duration_seconds?: number;
        prompt_preview?: string;
        media_asset_id?: number;
    } | null;
};

type Props = {
    runId: number;
    masterDrive: MasterDriveInfo;
    hasEpisode: boolean;
    onDone?: () => void;
    className?: string;
};

export function MasterDrivePanel({
    runId,
    masterDrive,
    hasEpisode,
    onDone,
    className,
}: Props) {
    const [busy, setBusy] = useState<'assemble' | 'imagine' | null>(null);

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
        setBusy('imagine');
        router.post(
            `/studio/runs/${runId}/imagine-master`,
            { duration: 6 },
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
                Stages edit the <span className="font-medium text-foreground">package</span>.
                These actions rebuild the episode{' '}
                <span className="font-mono text-[10px]">video_master</span> so
                Program output shows <em>this run</em>.
            </p>

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
                            Script/VTT → card film via ffmpeg. No API key.
                            {!masterDrive.ffmpegAvailable
                                ? ' · ffmpeg missing on server'
                                : ''}
                            {busy === 'assemble' ? ' · building…' : ''}
                        </p>
                    </button>

                    <button
                        type="button"
                        disabled={
                            !masterDrive.imagineConfigured || busy !== null
                        }
                        onClick={imagine}
                        className={cn(
                            'rounded-md border p-2 text-left transition-colors',
                            'hover:bg-muted/50 disabled:opacity-50',
                            busy === 'imagine' && 'ring-1 ring-primary',
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
                                API $
                            </Badge>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Short Grok Imagine clip from package prompts.
                            Requires XAI_API_KEY (usage billing, not SuperGrok).
                            {!masterDrive.imagineConfigured
                                ? ' · key not set'
                                : ''}
                            {busy === 'imagine' ? ' · generating…' : ''}
                        </p>
                    </button>
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
                    disabled={!hasEpisode || !masterDrive.ffmpegAvailable || busy !== null}
                    onClick={assemble}
                >
                    <Wrench className="size-3" />
                    Assemble
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="h-7 flex-1 text-[11px]"
                    disabled={
                        !hasEpisode ||
                        !masterDrive.imagineConfigured ||
                        busy !== null
                    }
                    onClick={imagine}
                >
                    <Sparkles className="size-3" />
                    Imagine
                </Button>
            </div>
        </div>
    );
}
