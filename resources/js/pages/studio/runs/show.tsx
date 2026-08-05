import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    Bot,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clapperboard,
    FileJson,
    FileText,
    Film,
    History,
    ImageIcon,
    LayoutList,
    Loader2,
    Mic,
    PanelRightClose,
    PanelRightOpen,
    RefreshCw,
    Save,
    ShieldCheck,
    Sparkles,
    Upload,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CaptionsPreview } from '@/components/studio/captions-preview';
import { CurriculumPreview } from '@/components/studio/curriculum-preview';
import {
    EpisodeOutputPreview,
    linesFromScriptPayload,
    type EpisodePreview,
} from '@/components/studio/episode-output-preview';
import { EpisodeMediaPanel } from '@/components/studio/episode-media-panel';
import {
    ProgramDock,
    readDockOpenDefault,
    writeDockOpen,
} from '@/components/studio/program-dock';
import {
    PublishChecklist,
    type ChecklistItem,
} from '@/components/studio/publish-checklist';
import { QualityReportPreview } from '@/components/studio/quality-report-preview';
import {
    ScriptPreview,
    type ScriptPayload,
} from '@/components/studio/script-preview';
import { StoryboardPreview } from '@/components/studio/storyboard-preview';
import { TimelinePreview } from '@/components/studio/timeline-preview';
import { VisualPromptsPreview } from '@/components/studio/visual-prompts-preview';
import { VoicePreview } from '@/components/studio/voice-preview';
import {
    extractVttFromPayload,
    StudioPlayer,
} from '@/components/studio/studio-player';
import {
    MasterDrivePanel,
    type MasterDriveInfo,
} from '@/components/studio/master-drive-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Artifact = {
    id: number;
    kind: string;
    stage: string | null;
    version: number;
    payload: unknown;
    meta?: Record<string, unknown> | null;
    updatedAt?: string | null;
};

type Step = {
    id: string;
    label: string;
    kinds: string[];
    description: string;
    ready: boolean;
};

type AgentOption = {
    id: number;
    name: string;
    slug: string;
    isDefault: boolean;
    model: string;
};

type Props = {
    run: {
        id: number;
        status: string;
        currentStage: string | null;
        error: string | null;
        startedAt: string | null;
        scriptApprovedAt: string | null;
        finalApprovedAt: string | null;
        agentProfileMap: Record<string, number>;
        meta: Record<string, unknown>;
        spec: {
            slug: string | null;
            title: string | null;
            episodeSlug: string | null;
            spec?: Record<string, unknown> | null;
        };
        artifacts: Artifact[];
        latestByKind: Record<string, Artifact>;
    };
    steps: Step[];
    agentProfilesByStage: Record<string, AgentOption[]>;
    xaiConfigured: boolean;
    usage?: {
        artifact_count: number;
        versions: number;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        xai_calls: number;
    };
    publishChecklist?: ChecklistItem[];
    episodeMedia?: {
        slug: string;
        media: Array<{
            id: number;
            kind: string;
            mimeType: string | null;
            sizeBytes: number | null;
            url: string | null;
        }>;
    } | null;
    episodePreview?: EpisodePreview | null;
    masterDrive?: MasterDriveInfo;
};

type InspectorTab = 'tools' | 'agents' | 'media' | 'history';
type CenterTab = 'preview' | 'source' | 'notes' | 'output';

const STEP_ICONS: Record<string, typeof FileText> = {
    curriculum: BookOpen,
    script: FileText,
    voice: Mic,
    storyboard: LayoutList,
    visual_prompts: ImageIcon,
    editor: Film,
    quality: ShieldCheck,
};

function shortStatus(status: string): string {
    return status.replaceAll('_', ' ');
}

export default function StudioRunShow({
    run,
    steps,
    agentProfilesByStage,
    xaiConfigured,
    usage,
    episodeMedia = null,
    episodePreview = null,
    masterDrive = {
        xaiConfigured: false,
        imagineConfigured: false,
        ffmpegAvailable: false,
        last: null,
    },
    publishChecklist = [],
}: Props) {
    const [activeStepId, setActiveStepId] = useState(
        steps.find((s) => s.ready)?.id ?? steps[0]?.id ?? 'script',
    );
    const [centerTab, setCenterTab] = useState<CenterTab>('preview');
    const [inspectorOpen, setInspectorOpen] = useState(true);
    const [inspectorTab, setInspectorTab] = useState<InspectorTab>('tools');
    const [outputDockOpen, setOutputDockOpen] = useState(() =>
        readDockOpenDefault(true),
    );
    const [jsonError, setJsonError] = useState<string | null>(null);

    const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0];
    const primaryKind = activeStep?.kinds[0] ?? 'script';
    const primaryArtifact = run.latestByKind[primaryKind];

    const [draftJson, setDraftJson] = useState(() =>
        JSON.stringify(primaryArtifact?.payload ?? {}, null, 2),
    );

    useEffect(() => {
        setDraftJson(JSON.stringify(primaryArtifact?.payload ?? {}, null, 2));
        setJsonError(null);
        setCenterTab('preview');
    }, [activeStepId, primaryArtifact?.id, primaryArtifact?.version]);

    const agentForm = useForm({
        agent_profile_map: { ...run.agentProfileMap } as Record<
            string,
            number | null
        >,
    });

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
                title: `#${run.id}`,
                href: `/studio/runs/${run.id}`,
            },
        ],
    });

    const regenerating =
        typeof run.meta?.regenerate_stage === 'string'
            ? String(run.meta.regenerate_stage)
            : null;
    const isBusy = run.status.includes('running') || regenerating !== null;

    const qualityFailed = useMemo(() => {
        const report = run.latestByKind.quality_report?.payload;
        if (!report || typeof report !== 'object') {
            return false;
        }
        const r = report as {
            passed?: boolean;
            deterministic?: { passed?: boolean };
        };
        if (typeof r.passed === 'boolean') {
            return r.passed === false;
        }

        return r.deterministic?.passed === false;
    }, [run.latestByKind.quality_report?.payload]);

    const stageNotes = (
        run.meta?.stage_notes as
            | Record<string, { notes?: string; updated_at?: string }>
            | undefined
    )?.[activeStepId];

    function refreshEpisodePreview() {
        router.reload({
            only: [
                'episodePreview',
                'episodeMedia',
                'run',
                'publishChecklist',
                'usage',
            ],
        });
    }

    function setDockOpen(open: boolean) {
        writeDockOpen(open);
        setOutputDockOpen(open);
    }

    // While a stage is regenerating, poll package + media so captions/master update.
    useEffect(() => {
        if (!regenerating && !run.status.includes('running')) {
            return;
        }
        const id = window.setInterval(() => {
            refreshEpisodePreview();
        }, 2500);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regenerating, run.status, run.id]);

    function saveArtifact() {
        try {
            const payload = JSON.parse(draftJson) as Record<
                string,
                string | number | boolean | null | object
            >;
            setJsonError(null);
            router.post(
                `/studio/runs/${run.id}/artifacts`,
                {
                    kind: primaryKind,
                    payload: payload as never,
                },
                {
                    onSuccess: () => refreshEpisodePreview(),
                },
            );
        } catch {
            setJsonError('Invalid JSON');
        }
    }

    function regenerate(stage: string) {
        const profileId = agentForm.data.agent_profile_map[stage] ?? null;
        router.post(
            `/studio/runs/${run.id}/regenerate`,
            {
                stage,
                agent_profile_id: profileId,
            },
            {
                onSuccess: () => {
                    // Jobs may still be running; reload package captions + media shortly.
                    window.setTimeout(() => refreshEpisodePreview(), 400);
                },
            },
        );
    }

    /** Live script lines prefer in-editor draft when editing script. */
    const scriptLines = useMemo(() => {
        if (activeStepId === 'script' && centerTab === 'source') {
            try {
                return linesFromScriptPayload(JSON.parse(draftJson));
            } catch {
                /* fall through */
            }
        }
        if (activeStepId === 'script' && centerTab === 'preview') {
            try {
                return linesFromScriptPayload(JSON.parse(draftJson));
            } catch {
                /* fall through */
            }
        }
        return linesFromScriptPayload(run.latestByKind.script?.payload);
    }, [
        activeStepId,
        centerTab,
        draftJson,
        run.latestByKind.script?.payload,
    ]);

    const onScreenLabels = useMemo(() => {
        let payload: unknown = run.latestByKind.on_screen_text?.payload;
        if (
            activeStepId === 'editor' &&
            primaryKind === 'on_screen_text'
        ) {
            try {
                payload = JSON.parse(draftJson);
            } catch {
                /* keep artifact */
            }
        }
        if (!payload || typeof payload !== 'object') {
            return [] as Array<{ text?: string; timecode?: string }>;
        }
        const data = payload as {
            labels?: Array<{ text?: string; timecode?: string }>;
            on_screen_text?: Array<{ text_sq?: string; time?: string }>;
        };
        if (Array.isArray(data.labels)) {
            return data.labels;
        }
        if (Array.isArray(data.on_screen_text)) {
            return data.on_screen_text.map((row) => ({
                text: row.text_sq,
                timecode: row.time,
            }));
        }
        return [];
    }, [
        activeStepId,
        primaryKind,
        draftJson,
        run.latestByKind.on_screen_text?.payload,
    ]);

    /** Live package VTT from draft JSON while editing captions. */
    const livePackageVtt = useMemo(() => {
        if (primaryKind === 'subtitles_vtt') {
            try {
                const fromDraft = extractVttFromPayload(JSON.parse(draftJson));
                if (fromDraft) {
                    return fromDraft;
                }
            } catch {
                /* ignore invalid draft */
            }
        }
        return (
            extractVttFromPayload(
                run.latestByKind.subtitles_vtt?.payload,
            ) ??
            episodePreview?.packageVtt ??
            null
        );
    }, [
        primaryKind,
        draftJson,
        run.latestByKind.subtitles_vtt?.payload,
        episodePreview?.packageVtt,
    ]);

    const preferPackageCaptions =
        primaryKind === 'subtitles_vtt' ||
        activeStepId === 'editor' ||
        Boolean(livePackageVtt && !episodePreview?.playback.hasCaptions);

    function saveNotes(notes: string) {
        if (!activeStep || !notes.trim()) {
            return;
        }
        router.post(`/studio/runs/${run.id}/notes`, {
            stage: activeStep.id,
            notes: notes.trim(),
        });
    }

    // Workbench shortcuts: 1–7 steps · p/s/n center tabs · [ inspector · r regen · mod+s save
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            if (
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                target?.isContentEditable
            ) {
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveArtifact();
                return;
            }

            if (e.key >= '1' && e.key <= '9') {
                const idx = Number(e.key) - 1;
                if (steps[idx]) {
                    e.preventDefault();
                    setActiveStepId(steps[idx].id);
                }
                return;
            }

            if (e.key === 'p' || e.key === 'P') {
                setCenterTab('preview');
            } else if (e.key === 's' || e.key === 'S') {
                setCenterTab('source');
            } else if (e.key === 'n' || e.key === 'N') {
                setCenterTab('notes');
            } else if (e.key === 'o' || e.key === 'O') {
                setCenterTab('output');
            } else if (e.key === ']') {
                setDockOpen(!outputDockOpen);
            } else if (e.key === '[') {
                setInspectorOpen((v) => !v);
            } else if (e.key === 'r' || e.key === 'R') {
                if (activeStep && !isBusy) {
                    regenerate(activeStep.id);
                }
            }
        }

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- workbench hotkeys
    }, [
        steps,
        activeStepId,
        isBusy,
        draftJson,
        primaryKind,
        run.id,
        outputDockOpen,
    ]);

    return (
        <>
            <Head
                title={`${run.spec.title ?? 'Run'} · #${run.id}`}
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
                {/* Toolbar */}
                <div className="flex h-9 shrink-0 items-center gap-1.5 border-b bg-background px-2">
                    {run.spec.slug ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <Link href={`/studio/specs/${run.spec.slug}`}>
                                Spec
                            </Link>
                        </Button>
                    ) : null}
                    <span className="truncate text-xs font-semibold">
                        {run.spec.title ?? `Run #${run.id}`}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        #{run.id}
                    </span>
                    <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] font-normal capitalize"
                    >
                        {shortStatus(run.status)}
                    </Badge>
                    {run.currentStage ? (
                        <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] font-normal"
                        >
                            {run.currentStage}
                        </Badge>
                    ) : null}
                    {regenerating ? (
                        <Badge
                            variant="outline"
                            className="h-5 gap-1 px-1.5 text-[10px]"
                        >
                            <Loader2 className="size-3 animate-spin" />
                            {regenerating}
                        </Badge>
                    ) : null}
                    <Badge
                        variant={xaiConfigured ? 'default' : 'secondary'}
                        className="hidden h-5 gap-1 px-1.5 text-[10px] sm:inline-flex"
                    >
                        <Sparkles className="size-3" />
                        {xaiConfigured ? 'Grok' : 'Stub'}
                    </Badge>

                    <div className="ml-auto flex items-center gap-1">
                        <GateActions
                            run={run}
                            qualityFailed={qualityFailed}
                            isBusy={isBusy}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={
                                !run.spec.episodeSlug ||
                                !masterDrive.ffmpegAvailable
                            }
                            title="Assemble local card-film master from package"
                            onClick={() => {
                                router.post(
                                    `/studio/runs/${run.id}/assemble-preview`,
                                    {},
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setDockOpen(true);
                                            setCenterTab('output');
                                            refreshEpisodePreview();
                                        },
                                    },
                                );
                            }}
                        >
                            Assemble
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={
                                !run.spec.episodeSlug ||
                                !masterDrive.imagineConfigured
                            }
                            title="Generate short Imagine video (API usage)"
                            onClick={() => {
                                router.post(
                                    `/studio/runs/${run.id}/imagine-master`,
                                    { duration: 6 },
                                    {
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            setDockOpen(true);
                                            setCenterTab('output');
                                            refreshEpisodePreview();
                                        },
                                    },
                                );
                            }}
                        >
                            <Sparkles className="size-3" />
                            Imagine
                        </Button>
                        {episodePreview?.playback.hasVideo ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                    setCenterTab('output');
                                    setDockOpen(true);
                                    refreshEpisodePreview();
                                }}
                            >
                                <Film className="size-3" />
                                Watch
                            </Button>
                        ) : null}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <a href={`/studio/runs/${run.id}/export`} download>
                                Export
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 px-0"
                            onClick={() => setDockOpen(!outputDockOpen)}
                            title="Toggle output dock"
                        >
                            <Film className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 px-0"
                            onClick={() => setInspectorOpen((v) => !v)}
                            title={
                                inspectorOpen
                                    ? 'Hide inspector'
                                    : 'Show inspector'
                            }
                        >
                            {inspectorOpen ? (
                                <PanelRightClose className="size-3.5" />
                            ) : (
                                <PanelRightOpen className="size-3.5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Status strip */}
                {(run.error ||
                    qualityFailed ||
                    run.status === 'rejected' ||
                    (run.meta?.quality_override as { reason?: string } | undefined)
                        ?.reason) && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-background px-2 py-1 text-[11px]">
                        {run.error ? (
                            <StatusChip tone="danger" icon={<AlertTriangle className="size-3" />}>
                                {run.error}
                            </StatusChip>
                        ) : null}
                        {qualityFailed ? (
                            <StatusChip tone="danger" icon={<XCircle className="size-3" />}>
                                Quality failed — override needs a reason
                            </StatusChip>
                        ) : null}
                        {run.status === 'rejected' ? (
                            <StatusChip tone="danger" icon={<XCircle className="size-3" />}>
                                Rejected:{' '}
                                {(run.meta?.reject_reason as string) ||
                                    'no reason'}
                            </StatusChip>
                        ) : null}
                        {(run.meta?.quality_override as { reason?: string })
                            ?.reason ? (
                            <StatusChip tone="warn" icon={<AlertTriangle className="size-3" />}>
                                Override:{' '}
                                {
                                    (
                                        run.meta.quality_override as {
                                            reason: string;
                                        }
                                    ).reason
                                }
                            </StatusChip>
                        ) : null}
                    </div>
                )}

                {/* Workbench body */}
                <div className="flex min-h-0 flex-1">
                    {/* Step rail */}
                    <nav className="flex w-12 shrink-0 flex-col border-r bg-background py-1 sm:w-36">
                        {steps.map((step, index) => {
                            const Icon = STEP_ICONS[step.id] ?? FileText;
                            const active = activeStepId === step.id;

                            return (
                                <Tooltip key={step.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveStepId(step.id)
                                            }
                                            className={cn(
                                                'mx-1 flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[11px] transition-colors',
                                                active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                                !step.ready && !active && 'opacity-60',
                                            )}
                                        >
                                            <span className="flex size-5 shrink-0 items-center justify-center">
                                                {step.ready ? (
                                                    <Icon className="size-3.5" />
                                                ) : (
                                                    <span className="text-[10px] opacity-70">
                                                        {index + 1}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="hidden min-w-0 flex-1 truncate font-medium sm:block">
                                                {step.label}
                                            </span>
                                            {step.ready ? (
                                                <CheckCircle2 className="hidden size-3 shrink-0 opacity-80 sm:block" />
                                            ) : null}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-48 text-xs">
                                        <p className="font-medium">{step.label}</p>
                                        <p className="text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </nav>

                    {/* Center editor */}
                    <section className="flex min-w-0 flex-1 flex-col">
                        <div className="flex h-8 shrink-0 items-center gap-1 border-b bg-background px-2">
                            <span className="mr-1 truncate text-xs font-semibold">
                                {activeStep?.label}
                            </span>
                            {primaryArtifact ? (
                                <span className="text-[10px] text-muted-foreground">
                                    {primaryKind} v{primaryArtifact.version}
                                </span>
                            ) : (
                                <span className="text-[10px] text-muted-foreground">
                                    empty
                                </span>
                            )}

                            <div className="ml-2 flex rounded-md border p-0.5">
                                {(
                                    [
                                        ['preview', 'Preview'],
                                        ['source', 'Source'],
                                        ['notes', 'Notes'],
                                        ['output', 'Output'],
                                    ] as const
                                ).map(([id, label]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setCenterTab(id)}
                                        className={cn(
                                            'rounded px-2 py-0.5 text-[10px] font-medium',
                                            centerTab === id
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <span className="ml-auto hidden text-[10px] text-muted-foreground xl:inline">
                                1–7 · P/S/N/O · [ ] docks · drag program edge · R
                                · ⌘S
                            </span>
                            <div className="flex items-center gap-1">
                                {activeStepId === 'voice' ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[11px]"
                                        disabled={isBusy}
                                        onClick={() =>
                                            router.post(
                                                `/studio/runs/${run.id}/preview-voice`,
                                            )
                                        }
                                    >
                                        TTS cues
                                    </Button>
                                ) : null}
                                {activeStepId === 'visual_prompts' ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-[11px]"
                                        disabled={isBusy}
                                        onClick={() =>
                                            router.post(
                                                `/studio/runs/${run.id}/preview-visual`,
                                            )
                                        }
                                    >
                                        Visual stubs
                                    </Button>
                                ) : null}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-6 px-2 text-[11px]"
                                    disabled={isBusy || !activeStep}
                                    onClick={() =>
                                        activeStep &&
                                        regenerate(activeStep.id)
                                    }
                                >
                                    <RefreshCw className="size-3" />
                                    Regen
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-6 px-2 text-[11px]"
                                    disabled={isBusy || !activeStep}
                                    onClick={saveArtifact}
                                >
                                    <Save className="size-3" />
                                    Save
                                </Button>
                            </div>
                        </div>

                        <div
                            className={cn(
                                'min-h-0 flex-1 p-2',
                                centerTab === 'output'
                                    ? 'overflow-hidden'
                                    : 'overflow-auto',
                            )}
                        >
                            {centerTab === 'preview' ? (
                                <div className="studio-dense mx-auto max-w-5xl">
                                    <StagePreview
                                        stepId={activeStepId}
                                        run={run}
                                        primaryArtifact={primaryArtifact}
                                        draftJson={draftJson}
                                        onScriptChange={(next) =>
                                            setDraftJson(
                                                JSON.stringify(next, null, 2),
                                            )
                                        }
                                    />
                                </div>
                            ) : null}

                            {centerTab === 'source' ? (
                                <div className="flex h-full min-h-[16rem] flex-col gap-1">
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <FileJson className="size-3" />
                                        Artifact JSON · new version on save
                                        {jsonError ? (
                                            <span className="text-destructive">
                                                {jsonError}
                                            </span>
                                        ) : null}
                                    </div>
                                    <textarea
                                        value={draftJson}
                                        onChange={(e) =>
                                            setDraftJson(e.target.value)
                                        }
                                        spellCheck={false}
                                        className="min-h-0 flex-1 resize-none rounded border bg-background p-2 font-mono text-[11px] leading-relaxed focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    />
                                </div>
                            ) : null}

                            {centerTab === 'notes' ? (
                                <div className="mx-auto max-w-xl space-y-2">
                                    <Label className="text-xs">
                                        Editor notes · {activeStep?.label}
                                    </Label>
                                    <textarea
                                        key={`notes-${activeStepId}-${stageNotes?.updated_at ?? 'new'}`}
                                        defaultValue={
                                            typeof stageNotes?.notes ===
                                            'string'
                                                ? stageNotes.notes
                                                : ''
                                        }
                                        placeholder="Direction for this stage…"
                                        className="min-h-32 w-full rounded border bg-background p-2 text-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        onBlur={(e) =>
                                            saveNotes(e.target.value)
                                        }
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Saves on blur · fed into agent regen
                                        context
                                    </p>
                                </div>
                            ) : null}

                            {centerTab === 'output' ? (
                                <div className="h-full min-h-0">
                                    <EpisodeOutputPreview
                                        episode={episodePreview}
                                        scriptLines={scriptLines}
                                        onScreenLabels={onScreenLabels}
                                        livePackageVtt={livePackageVtt}
                                        preferPackageCaptions={
                                            preferPackageCaptions
                                        }
                                        mode="full"
                                    />
                                </div>
                            ) : null}
                        </div>

                        {centerTab !== 'output' ? (
                            <ProgramDock
                                open={outputDockOpen}
                                onOpenChange={setDockOpen}
                                hasVideo={Boolean(
                                    episodePreview?.playback.hasVideo,
                                )}
                            >
                                <EpisodeOutputPreview
                                    episode={episodePreview}
                                    scriptLines={scriptLines}
                                    onScreenLabels={onScreenLabels}
                                    livePackageVtt={livePackageVtt}
                                    preferPackageCaptions={
                                        preferPackageCaptions
                                    }
                                    mode="dock"
                                    className="h-full"
                                />
                            </ProgramDock>
                        ) : null}
                    </section>

                    {/* Inspector */}
                    {inspectorOpen ? (
                        <aside className="flex w-64 shrink-0 flex-col border-l bg-background xl:w-72">
                            <div className="flex h-8 shrink-0 items-center gap-0.5 border-b px-1">
                                {(
                                    [
                                        ['tools', 'Tools'],
                                        ['agents', 'Agents'],
                                        ['media', 'Media'],
                                        ['history', 'History'],
                                    ] as const
                                ).map(([id, label]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setInspectorTab(id)}
                                        className={cn(
                                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                            inspectorTab === id
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="min-h-0 flex-1 overflow-auto p-2 text-xs">
                                {inspectorTab === 'tools' ? (
                                    <ToolsPanel
                                        run={run}
                                        usage={usage}
                                        publishChecklist={publishChecklist}
                                        qualityFailed={qualityFailed}
                                        xaiConfigured={xaiConfigured}
                                        hasVideoMaster={Boolean(
                                            episodePreview?.playback.hasVideo,
                                        )}
                                        masterDrive={masterDrive}
                                        runId={run.id}
                                        hasEpisode={Boolean(
                                            run.spec.episodeSlug,
                                        )}
                                        onMasterDriven={() => {
                                            setDockOpen(true);
                                            refreshEpisodePreview();
                                        }}
                                    />
                                ) : null}

                                {inspectorTab === 'agents' ? (
                                    <AgentsPanel
                                        steps={steps}
                                        agentProfilesByStage={
                                            agentProfilesByStage
                                        }
                                        agentForm={agentForm}
                                        runId={run.id}
                                        xaiConfigured={xaiConfigured}
                                    />
                                ) : null}

                                {inspectorTab === 'media' ? (
                                    <div className="space-y-3">
                                        {episodePreview?.playback.hasVideo &&
                                        episodePreview.playback.src ? (
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Live master
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="text-[10px] font-medium text-primary hover:underline"
                                                        onClick={() =>
                                                            refreshEpisodePreview()
                                                        }
                                                    >
                                                        Refresh
                                                    </button>
                                                </div>
                                                <StudioPlayer
                                                    src={
                                                        episodePreview.playback
                                                            .src
                                                    }
                                                    poster={
                                                        episodePreview.playback
                                                            .poster
                                                    }
                                                    captionsSrc={
                                                        preferPackageCaptions
                                                            ? null
                                                            : episodePreview
                                                                  .playback
                                                                  .captionsSrc
                                                    }
                                                    packageVtt={livePackageVtt}
                                                    preferPackageVtt={
                                                        preferPackageCaptions
                                                    }
                                                    title={
                                                        episodePreview.title
                                                    }
                                                    mimeType={
                                                        episodePreview.playback
                                                            .mimeType
                                                    }
                                                    captionsLang={
                                                        episodePreview.playback
                                                            .language
                                                    }
                                                    dense
                                                />
                                            </div>
                                        ) : null}
                                        {episodeMedia ? (
                                            <EpisodeMediaPanel
                                                episodeSlug={episodeMedia.slug}
                                                media={episodeMedia.media}
                                                onUploaded={() => {
                                                    setDockOpen(true);
                                                    refreshEpisodePreview();
                                                }}
                                            />
                                        ) : (
                                            <p className="text-muted-foreground">
                                                No episode linked on this spec.
                                            </p>
                                        )}
                                    </div>
                                ) : null}

                                {inspectorTab === 'history' ? (
                                    <HistoryPanel artifacts={run.artifacts} />
                                ) : null}
                            </div>
                        </aside>
                    ) : null}
                </div>
            </div>
        </>
    );
}

function StatusChip({
    children,
    tone,
    icon,
}: {
    children: ReactNode;
    tone: 'danger' | 'warn';
    icon: ReactNode;
}) {
    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1 truncate rounded px-1.5 py-0.5',
                tone === 'danger' &&
                    'bg-destructive/10 text-destructive',
                tone === 'warn' &&
                    'bg-amber-500/10 text-amber-800 dark:text-amber-200',
            )}
        >
            {icon}
            <span className="truncate">{children}</span>
        </span>
    );
}

function GateActions({
    run,
    qualityFailed,
    isBusy,
}: {
    run: Props['run'];
    qualityFailed: boolean;
    isBusy: boolean;
}) {
    if (run.status === 'awaiting_script_review') {
        return (
            <>
                <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={isBusy}
                    onClick={() =>
                        router.post(`/studio/runs/${run.id}/approve`, {
                            gate: 'script',
                        })
                    }
                >
                    <CheckCircle2 className="size-3" />
                    Approve script
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    disabled={isBusy}
                    onClick={() => {
                        const reason =
                            window.prompt(
                                'Reject reason:',
                                'Needs rewrite',
                            ) ?? '';
                        router.post(`/studio/runs/${run.id}/reject`, {
                            reason: reason.trim() || 'Needs rewrite',
                        });
                    }}
                >
                    Reject
                </Button>
            </>
        );
    }

    if (run.status === 'awaiting_final_review') {
        return (
            <>
                <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={isBusy || qualityFailed}
                    onClick={() =>
                        router.post(`/studio/runs/${run.id}/approve`, {
                            gate: 'final',
                        })
                    }
                >
                    <CheckCircle2 className="size-3" />
                    Approve final
                </Button>
                {qualityFailed ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-xs"
                        disabled={isBusy}
                        onClick={() => {
                            const reason =
                                window.prompt(
                                    'Quality override reason (required):',
                                ) ?? '';
                            if (!reason.trim()) {
                                return;
                            }
                            router.post(`/studio/runs/${run.id}/approve`, {
                                gate: 'final',
                                force_quality_override: true,
                                override_reason: reason,
                            });
                        }}
                    >
                        Override
                    </Button>
                ) : null}
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    disabled={isBusy}
                    onClick={() => {
                        const reason =
                            window.prompt('Reject reason:') ?? '';
                        router.post(
                            `/studio/runs/${run.id}/reject`,
                            reason.trim() ? { reason } : {},
                        );
                    }}
                >
                    Reject
                </Button>
            </>
        );
    }

    if (run.status === 'failed') {
        return (
            <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={() =>
                    router.post(`/studio/runs/${run.id}/retry`, {
                        chain: 'a',
                    })
                }
            >
                <RefreshCw className="size-3" />
                Retry
            </Button>
        );
    }

    if (run.status === 'approved' && run.spec.episodeSlug) {
        return (
            <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() =>
                    router.post(`/studio/runs/${run.id}/publish`, {
                        episode_slug: run.spec.episodeSlug,
                    })
                }
            >
                <Upload className="size-3" />
                Publish
            </Button>
        );
    }

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => router.post(`/studio/runs/${run.id}/clone`)}
        >
            Clone
        </Button>
    );
}

function parseDraftPayload(draftJson: string, fallback: unknown): unknown {
    try {
        return JSON.parse(draftJson);
    } catch {
        return fallback ?? {};
    }
}

function StagePreview({
    stepId,
    run,
    primaryArtifact,
    draftJson,
    onScriptChange,
}: {
    stepId: string;
    run: Props['run'];
    primaryArtifact?: Artifact;
    draftJson: string;
    onScriptChange: (next: ScriptPayload) => void;
}) {
    // Edits must bind to the local draft, not server artifact — otherwise
    // controlled inputs reset on every keystroke.
    const draftPayload = parseDraftPayload(
        draftJson,
        primaryArtifact?.payload ?? {},
    );

    if (stepId === 'curriculum') {
        return <CurriculumPreview payload={draftPayload} />;
    }
    if (stepId === 'script') {
        return (
            <ScriptPreview
                payload={draftPayload as ScriptPayload}
                editable
                onChange={onScriptChange}
            />
        );
    }
    if (stepId === 'storyboard') {
        return <StoryboardPreview payload={draftPayload} />;
    }
    if (stepId === 'voice') {
        const vo =
            primaryArtifact?.kind === 'vo_script'
                ? draftPayload
                : run.latestByKind.vo_script?.payload;
        return (
            <div className="space-y-2">
                <VoicePreview
                    voPayload={vo}
                    ttsPayload={run.latestByKind.tts_manifest?.payload}
                />
                {Array.isArray(
                    (run.meta?.tts_preview as { cues?: unknown[] })?.cues,
                ) ? (
                    <p className="rounded border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                        TTS preview:{' '}
                        {(
                            run.meta?.tts_preview as {
                                stored_previews?: number;
                                provider?: string;
                            }
                        )?.stored_previews ?? 0}{' '}
                        cues ·{' '}
                        {(
                            run.meta?.tts_preview as { provider?: string }
                        )?.provider ?? 'null'}
                    </p>
                ) : null}
            </div>
        );
    }
    if (stepId === 'visual_prompts') {
        return (
            <div className="space-y-2">
                <VisualPromptsPreview payload={primaryArtifact?.payload} />
                {Array.isArray(
                    (run.meta?.visual_preview as { prompts?: unknown[] })
                        ?.prompts,
                ) ? (
                    <p className="rounded border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                        Visual stubs:{' '}
                        {(
                            run.meta?.visual_preview as {
                                stored_previews?: number;
                                provider?: string;
                            }
                        )?.stored_previews ?? 0}{' '}
                        ·{' '}
                        {(
                            run.meta?.visual_preview as {
                                provider?: string;
                            }
                        )?.provider ?? 'null'}
                    </p>
                ) : null}
            </div>
        );
    }
    if (stepId === 'editor') {
        return (
            <div className="space-y-3">
                <TimelinePreview
                    editPayload={run.latestByKind.edit_instructions?.payload}
                    onScreenPayload={run.latestByKind.on_screen_text?.payload}
                />
                <CaptionsPreview
                    payload={
                        run.latestByKind.subtitles_vtt?.payload ??
                        primaryArtifact?.payload
                    }
                />
            </div>
        );
    }
    if (stepId === 'quality') {
        return <QualityReportPreview payload={primaryArtifact?.payload} />;
    }

    return (
        <pre className="overflow-auto rounded border bg-muted/30 p-2 font-mono text-[11px]">
            {JSON.stringify(
                primaryArtifact?.payload ?? {
                    note: 'Generate this stage to preview.',
                },
                null,
                2,
            )}
        </pre>
    );
}

function ToolsPanel({
    run,
    usage,
    publishChecklist,
    qualityFailed,
    xaiConfigured,
    hasVideoMaster,
    masterDrive,
    runId,
    hasEpisode,
    onMasterDriven,
}: {
    run: Props['run'];
    usage?: Props['usage'];
    publishChecklist: ChecklistItem[];
    qualityFailed: boolean;
    xaiConfigured: boolean;
    hasVideoMaster: boolean;
    masterDrive: MasterDriveInfo;
    runId: number;
    hasEpisode: boolean;
    onMasterDriven?: () => void;
}) {
    return (
        <div className="space-y-3">
            <MasterDrivePanel
                runId={runId}
                masterDrive={masterDrive}
                hasEpisode={hasEpisode}
                onDone={onMasterDriven}
            />

            <div className="space-y-1.5 rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[11px] leading-snug">
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Package vs master
                </p>
                <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                    <li>
                        Stages edit the JSON package
                        {xaiConfigured
                            ? ' (Grok API when regenerating).'
                            : ' (stub regen without XAI_API_KEY).'}
                    </li>
                    <li>
                        Program dock plays{' '}
                        <span className="font-mono text-[10px]">
                            video_master
                        </span>
                        {hasVideoMaster ? ' (current file).' : ' (none yet).'}
                    </li>
                    <li>
                        Use <strong>Assemble</strong> (free cards) or{' '}
                        <strong>Imagine</strong> (API $) above to rebuild the
                        master from this package.
                    </li>
                </ol>
            </div>

            <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Quick links
                </p>
                <div className="flex flex-col gap-0.5">
                    {run.spec.slug ? (
                        <Link
                            href={`/studio/specs/${run.spec.slug}`}
                            className="rounded px-1.5 py-1 hover:bg-muted"
                        >
                            Open spec
                        </Link>
                    ) : null}
                    {run.spec.episodeSlug ? (
                        <Link
                            href={`/studio/episodes/${run.spec.episodeSlug}`}
                            className="rounded px-1.5 py-1 hover:bg-muted"
                        >
                            Episode hub
                        </Link>
                    ) : null}
                    <Link
                        href="/studio/agents"
                        className="rounded px-1.5 py-1 hover:bg-muted"
                    >
                        <Bot className="mr-1 inline size-3" />
                        Manage agents
                    </Link>
                    <Link
                        href="/studio/brand"
                        className="rounded px-1.5 py-1 hover:bg-muted"
                    >
                        Brand bible
                    </Link>
                    {run.spec.episodeSlug ? (
                        <a
                            href={`/videos/${run.spec.episodeSlug}`}
                            className="rounded px-1.5 py-1 hover:bg-muted"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Clapperboard className="mr-1 inline size-3" />
                            Public watch
                        </a>
                    ) : null}
                </div>
            </div>

            {usage ? (
                <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Usage
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                        {[
                            ['Artifacts', usage.artifact_count],
                            ['Versions', usage.versions],
                            ['xAI calls', usage.xai_calls],
                            ['Tokens', usage.total_tokens],
                        ].map(([label, value]) => (
                            <div
                                key={String(label)}
                                className="rounded border px-1.5 py-1"
                            >
                                <p className="text-[10px] text-muted-foreground">
                                    {label}
                                </p>
                                <p className="font-semibold tabular-nums">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {publishChecklist.length > 0 ? (
                <div className="studio-dense">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Publish checklist
                        {qualityFailed ? ' · blocked' : ''}
                    </p>
                    <PublishChecklist items={publishChecklist} />
                </div>
            ) : null}

            <Button
                size="sm"
                variant="outline"
                className="h-7 w-full text-xs"
                onClick={() => router.post(`/studio/runs/${run.id}/clone`)}
            >
                Clone run
            </Button>
        </div>
    );
}

function AgentsPanel({
    steps,
    agentProfilesByStage,
    agentForm,
    runId,
    xaiConfigured,
}: {
    steps: Step[];
    agentProfilesByStage: Record<string, AgentOption[]>;
    agentForm: ReturnType<
        typeof useForm<{
            agent_profile_map: Record<string, number | null>;
        }>
    >;
    runId: number;
    xaiConfigured: boolean;
}) {
    return (
        <div className="space-y-2">
            {steps.map((step) => {
                const options = agentProfilesByStage[step.id] ?? [];
                const value =
                    agentForm.data.agent_profile_map[step.id] != null
                        ? String(agentForm.data.agent_profile_map[step.id])
                        : options.find((o) => o.isDefault)
                          ? String(options.find((o) => o.isDefault)!.id)
                          : options[0]
                            ? String(options[0].id)
                            : '';

                return (
                    <div key={step.id} className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">
                            {step.label}
                        </Label>
                        <Select
                            value={value}
                            onValueChange={(v) =>
                                agentForm.setData('agent_profile_map', {
                                    ...agentForm.data.agent_profile_map,
                                    [step.id]: Number(v),
                                })
                            }
                        >
                            <SelectTrigger className="h-7 w-full text-xs">
                                <SelectValue placeholder="Agent" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt) => (
                                    <SelectItem
                                        key={opt.id}
                                        value={String(opt.id)}
                                        className="text-xs"
                                    >
                                        {opt.name}
                                        {opt.isDefault ? ' · default' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            })}
            <Button
                size="sm"
                variant="secondary"
                className="h-7 w-full text-xs"
                disabled={agentForm.processing}
                onClick={() =>
                    agentForm.post(`/studio/runs/${runId}/agents`)
                }
            >
                Save agents
            </Button>
            <p className="text-[10px] text-muted-foreground">
                {xaiConfigured
                    ? 'Live Grok via XAI_API_KEY'
                    : 'Set XAI_API_KEY for live generation'}
            </p>
        </div>
    );
}

function HistoryPanel({ artifacts }: { artifacts: Artifact[] }) {
    const [openKinds, setOpenKinds] = useState<Record<string, boolean>>({});

    const grouped = useMemo(() => {
        const map = new Map<string, Artifact[]>();
        for (const a of artifacts) {
            const list = map.get(a.kind) ?? [];
            list.push(a);
            map.set(a.kind, list);
        }
        return [...map.entries()];
    }, [artifacts]);

    if (artifacts.length === 0) {
        return (
            <p className="text-muted-foreground">
                No artifacts yet. Start a run from the spec.
            </p>
        );
    }

    return (
        <div className="space-y-1">
            {grouped.map(([kind, items]) => {
                const open = openKinds[kind] ?? false;

                return (
                    <div key={kind} className="rounded border">
                        <button
                            type="button"
                            className="flex w-full items-center gap-1 px-1.5 py-1 text-left hover:bg-muted/50"
                            onClick={() =>
                                setOpenKinds((s) => ({
                                    ...s,
                                    [kind]: !open,
                                }))
                            }
                        >
                            {open ? (
                                <ChevronDown className="size-3" />
                            ) : (
                                <ChevronRight className="size-3" />
                            )}
                            <History className="size-3 text-muted-foreground" />
                            <span className="font-medium">{kind}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                                {items.length}v
                            </span>
                        </button>
                        {open ? (
                            <ul className="border-t px-1.5 py-1 text-[10px] text-muted-foreground">
                                {items.map((a) => (
                                    <li
                                        key={a.id}
                                        className="flex justify-between py-0.5"
                                    >
                                        <span>v{a.version}</span>
                                        <span>
                                            {(a.meta?.source as string) ??
                                                (a.meta?.agent as string) ??
                                                a.stage ??
                                                '—'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
