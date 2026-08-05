import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Bot,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Save,
    Sparkles,
    Upload,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EpisodeMediaPanel } from '@/components/studio/episode-media-panel';
import { PublishChecklist, type ChecklistItem } from '@/components/studio/publish-checklist';
import { CaptionsPreview } from '@/components/studio/captions-preview';
import { CurriculumPreview } from '@/components/studio/curriculum-preview';
import { ScriptPreview, type ScriptPayload } from '@/components/studio/script-preview';
import { StoryboardPreview } from '@/components/studio/storyboard-preview';
import { VoicePreview } from '@/components/studio/voice-preview';
import { VisualPromptsPreview } from '@/components/studio/visual-prompts-preview';
import { TimelinePreview } from '@/components/studio/timeline-preview';
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
};


function statusVariant(
    status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status.includes('failed') || status.includes('rejected')) {
        return 'destructive';
    }
    if (status.includes('approved') || status.includes('published')) {
        return 'default';
    }
    if (status.includes('awaiting') || status.includes('running')) {
        return 'secondary';
    }

    return 'outline';
}

export default function StudioRunShow({
    run,
    steps,
    agentProfilesByStage,
    xaiConfigured,
    usage,
    episodeMedia = null,
    publishChecklist = [],
}: Props) {
    const [activeStepId, setActiveStepId] = useState(
        steps.find((s) => s.ready)?.id ?? steps[0]?.id ?? 'script',
    );
    const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0];

    const primaryKind = activeStep?.kinds[0] ?? 'script';
    const primaryArtifact = run.latestByKind[primaryKind];

    const [draftJson, setDraftJson] = useState(() =>
        JSON.stringify(primaryArtifact?.payload ?? {}, null, 2),
    );
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Keep draft in sync when switching steps or new versions arrive
    useEffect(() => {
        setDraftJson(JSON.stringify(primaryArtifact?.payload ?? {}, null, 2));
        setJsonError(null);
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
                title: `Run #${run.id}`,
                href: `/studio/runs/${run.id}`,
            },
        ],
    });

    const regenerating =
        typeof run.meta?.regenerate_stage === 'string'
            ? String(run.meta.regenerate_stage)
            : null;

    const isBusy =
        run.status.includes('running') || regenerating !== null;

    function saveArtifact() {
        try {
            const payload = JSON.parse(draftJson) as Record<string, string | number | boolean | null | object>;
            setJsonError(null);
            router.post(`/studio/runs/${run.id}/artifacts`, {
                kind: primaryKind,
                // Inertia accepts nested JSON objects as form data.
                payload: payload as never,
            });
        } catch {
            setJsonError('Invalid JSON — fix syntax before saving.');
        }
    }

    function regenerate(stage: string) {
        const profileId = agentForm.data.agent_profile_map[stage] ?? null;
        router.post(`/studio/runs/${run.id}/regenerate`, {
            stage,
            agent_profile_id: profileId,
        });
    }

    const qualityFailed = (() => {
        const report = run.latestByKind.quality_report?.payload;
        if (!report || typeof report !== 'object') {
            return false;
        }
        const r = report as { passed?: boolean; deterministic?: { passed?: boolean } };
        if (typeof r.passed === 'boolean') {
            return r.passed === false;
        }
        return r.deterministic?.passed === false;
    })();

    return (
        <>
            <Head title={`Run #${run.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="space-y-3">
                    {run.spec.slug ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="-ml-2 w-fit"
                        >
                            <Link href={`/studio/specs/${run.spec.slug}`}>
                                <ArrowLeft />
                                {run.spec.title ?? 'Back to spec'}
                            </Link>
                        </Button>
                    ) : null}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                            <Heading
                                title={`Production workspace · Run #${run.id}`}
                                description={
                                    run.spec.episodeSlug
                                        ? `Episode · ${run.spec.episodeSlug}`
                                        : 'Step through script, voice, visuals, and edit packages'
                                }
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={statusVariant(run.status)}>
                                    {run.status.replaceAll('_', ' ')}
                                </Badge>
                                {run.currentStage ? (
                                    <Badge variant="outline">
                                        Stage · {run.currentStage}
                                    </Badge>
                                ) : null}
                                <Badge variant={xaiConfigured ? 'default' : 'secondary'}>
                                    <Sparkles className="size-3" />
                                    {xaiConfigured ? 'Grok / xAI live' : 'Stub agents (no API key)'}
                                </Badge>
                                {regenerating ? (
                                    <Badge variant="outline">
                                        <Loader2 className="size-3 animate-spin" />
                                        Regenerating {regenerating}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/studio/agents">
                                <Bot />
                                Manage agents
                            </Link>
                        </Button>
                    </div>
                </div>

                {run.error ? (
                    <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>Run error</AlertTitle>
                        <AlertDescription>{run.error}</AlertDescription>
                    </Alert>
                ) : null}

                {qualityFailed ? (
                    <Alert variant="destructive">
                        <XCircle />
                        <AlertTitle>Quality checks failed</AlertTitle>
                        <AlertDescription>
                            Final approve is blocked until quality passes.
                            Override only with a documented reason (editor
                            accountability).
                        </AlertDescription>
                    </Alert>
                ) : null}

                {(run.meta?.quality_override as { reason?: string } | undefined)
                    ?.reason ? (
                    <Alert>
                        <AlertTriangle />
                        <AlertTitle>Quality override applied</AlertTitle>
                        <AlertDescription>
                            {(
                                run.meta.quality_override as {
                                    reason?: string;
                                }
                            ).reason}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {/* Step navigator */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Workflow steps</CardTitle>
                        <CardDescription>
                            Jump between stages anytime. Regenerate or manually
                            edit without losing version history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {steps.map((step, index) => (
                                <Button
                                    key={step.id}
                                    type="button"
                                    size="sm"
                                    variant={
                                        activeStepId === step.id
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className={cn(
                                        'h-auto flex-col items-start gap-0.5 px-3 py-2',
                                        !step.ready && 'opacity-70',
                                    )}
                                    onClick={() => setActiveStepId(step.id)}
                                >
                                    <span className="text-[10px] font-normal opacity-70">
                                        Step {index + 1}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        {step.ready ? (
                                            <CheckCircle2 className="size-3.5" />
                                        ) : null}
                                        {step.label}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                                <div>
                                    <CardTitle>{activeStep?.label}</CardTitle>
                                    <CardDescription>
                                        {activeStep?.description}
                                        {primaryArtifact
                                            ? ` · ${primaryKind} v${primaryArtifact.version}`
                                            : ' · no artifact yet'}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={isBusy || !activeStep}
                                        onClick={() =>
                                            activeStep &&
                                            regenerate(activeStep.id)
                                        }
                                    >
                                        <RefreshCw />
                                        Regenerate with AI
                                    </Button>
                                    {activeStepId === 'voice' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={isBusy}
                                            onClick={() =>
                                                router.post(
                                                    `/studio/runs/${run.id}/preview-voice`,
                                                )
                                            }
                                        >
                                            Build voice preview cues
                                        </Button>
                                    ) : null}
                                    <Button
                                        size="sm"
                                        disabled={isBusy || !activeStep}
                                        onClick={saveArtifact}
                                    >
                                        <Save />
                                        Save edit
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {activeStepId === 'curriculum' ? (
                                    <CurriculumPreview
                                        payload={primaryArtifact?.payload}
                                    />
                                ) : activeStepId === 'script' ? (
                                    <ScriptPreview
                                        payload={(primaryArtifact?.payload ?? {}) as ScriptPayload}
                                        editable
                                        onChange={(next) =>
                                            setDraftJson(JSON.stringify(next, null, 2))
                                        }
                                    />
                                ) : activeStepId === 'storyboard' ? (
                                    <StoryboardPreview
                                        payload={primaryArtifact?.payload}
                                    />
                                ) : activeStepId === 'voice' ? (
                                    <div className="space-y-4">
                                        <VoicePreview
                                            voPayload={
                                                run.latestByKind.vo_script
                                                    ?.payload
                                            }
                                            ttsPayload={
                                                run.latestByKind.tts_manifest
                                                    ?.payload
                                            }
                                        />
                                        {Array.isArray(
                                            (
                                                run.meta?.tts_preview as
                                                    | {
                                                          cues?: unknown[];
                                                          stored_previews?: number;
                                                          provider?: string;
                                                      }
                                                    | undefined
                                            )?.cues,
                                        ) ? (
                                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                                <p className="font-medium">
                                                    TTS preview package
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {(
                                                        run.meta
                                                            ?.tts_preview as {
                                                            stored_previews?: number;
                                                            provider?: string;
                                                        }
                                                    )?.stored_previews ?? 0}{' '}
                                                    cues · provider{' '}
                                                    {(
                                                        run.meta
                                                            ?.tts_preview as {
                                                            provider?: string;
                                                        }
                                                    )?.provider ?? 'null'}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : activeStepId === 'visual_prompts' ? (
                                    <VisualPromptsPreview
                                        payload={primaryArtifact?.payload}
                                    />
                                ) : activeStepId === 'editor' ? (
                                    <div className="space-y-6">
                                        <TimelinePreview
                                            editPayload={
                                                run.latestByKind.edit_instructions
                                                    ?.payload
                                            }
                                            onScreenPayload={
                                                run.latestByKind.on_screen_text
                                                    ?.payload
                                            }
                                        />
                                        <CaptionsPreview
                                            payload={
                                                run.latestByKind.subtitles_vtt
                                                    ?.payload ??
                                                primaryArtifact?.payload
                                            }
                                        />
                                    </div>
                                ) : (
                                    <pre className="max-h-[22rem] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                                        {JSON.stringify(
                                            primaryArtifact?.payload ?? {
                                                note: 'Generate this stage to preview content.',
                                            },
                                            null,
                                            2,
                                        )}
                                    </pre>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="stage-notes">Editor notes for this step</Label>
                                    <textarea
                                        id="stage-notes"
                                        defaultValue={(() => {
                                            const stageNotes = run.meta
                                                ?.stage_notes as
                                                | Record<
                                                      string,
                                                      { notes?: string }
                                                  >
                                                | undefined;
                                            const notes =
                                                stageNotes?.[activeStepId]
                                                    ?.notes;

                                            return typeof notes === 'string'
                                                ? notes
                                                : '';
                                        })()}
                                        key={`notes-${activeStepId}-${String(
                                            (
                                                run.meta?.stage_notes as
                                                    | Record<
                                                          string,
                                                          {
                                                              updated_at?: string;
                                                          }
                                                      >
                                                    | undefined
                                            )?.[activeStepId]?.updated_at ??
                                                'new',
                                        )}`}
                                        className={cn(
                                            'min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                                            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        )}
                                        placeholder="Direction for this stage (pacing, props, retakes…)"
                                        onBlur={(e) => {
                                            if (!activeStep) {
                                                return;
                                            }
                                            const notes = e.target.value.trim();
                                            if (!notes) {
                                                return;
                                            }
                                            router.post(
                                                `/studio/runs/${run.id}/notes`,
                                                {
                                                    stage: activeStep.id,
                                                    notes,
                                                },
                                            );
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Notes save when you leave the field.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="artifact-json">
                                        Edit artifact JSON (new version on save)
                                    </Label>
                                    <textarea
                                        id="artifact-json"
                                        value={draftJson}
                                        onChange={(e) =>
                                            setDraftJson(e.target.value)
                                        }
                                        className={cn(
                                            'min-h-48 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs',
                                            'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        )}
                                        spellCheck={false}
                                    />
                                    {jsonError ? (
                                        <p className="text-sm text-destructive">
                                            {jsonError}
                                        </p>
                                    ) : null}
                                </div>

                                {activeStep && activeStep.kinds.length > 1 ? (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                            Related artifacts
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {activeStep.kinds.map((kind) => {
                                                const art = run.latestByKind[kind];
                                                return (
                                                    <Badge
                                                        key={kind}
                                                        variant={
                                                            art
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {kind}
                                                        {art
                                                            ? ` v${art.version}`
                                                            : ' —'}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        {/* Gate actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Pipeline gates
                                </CardTitle>
                                <CardDescription>
                                    Approve script to unlock chain B (storyboard →
                                    quality). Approve final when package is ready
                                    to publish.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {run.status === 'awaiting_script_review' ? (
                                    <>
                                        <Button
                                            onClick={() =>
                                                router.post(
                                                    `/studio/runs/${run.id}/approve`,
                                                    { gate: 'script' },
                                                )
                                            }
                                        >
                                            <CheckCircle2 />
                                            Approve script → continue
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                router.post(
                                                    `/studio/runs/${run.id}/reject`,
                                                    {
                                                        reason: 'Needs rewrite',
                                                    },
                                                )
                                            }
                                        >
                                            <XCircle />
                                            Reject run
                                        </Button>
                                    </>
                                ) : null}

                                {run.status === 'awaiting_final_review' ? (
                                    <>
                                        <Button
                                            disabled={qualityFailed}
                                            onClick={() =>
                                                router.post(
                                                    `/studio/runs/${run.id}/approve`,
                                                    { gate: 'final' },
                                                )
                                            }
                                        >
                                            <CheckCircle2 />
                                            Approve final package
                                        </Button>
                                        {qualityFailed ? (
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    const reason =
                                                        window.prompt(
                                                            'Quality override reason (required):',
                                                        ) ?? '';
                                                    if (!reason.trim()) return;
                                                    router.post(
                                                        `/studio/runs/${run.id}/approve`,
                                                        {
                                                            gate: 'final',
                                                            force_quality_override: true,
                                                            override_reason: reason,
                                                        },
                                                    );
                                                }}
                                            >
                                                Override quality & approve
                                            </Button>
                                        ) : null}
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                router.post(
                                                    `/studio/runs/${run.id}/reject`,
                                                )
                                            }
                                        >
                                            <XCircle />
                                            Reject
                                        </Button>
                                    </>
                                ) : null}

                                {run.status === 'failed' ? (
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            router.post(
                                                `/studio/runs/${run.id}/retry`,
                                                { chain: 'a' },
                                            )
                                        }
                                    >
                                        <RefreshCw />
                                        Retry chain A
                                    </Button>
                                ) : null}

                                {run.status === 'approved' &&
                                run.spec.episodeSlug ? (
                                    <Button
                                        onClick={() =>
                                            router.post(
                                                `/studio/runs/${run.id}/publish`,
                                                {
                                                    episode_slug:
                                                        run.spec.episodeSlug,
                                                },
                                            )
                                        }
                                    >
                                        <Upload />
                                        Publish episode
                                    </Button>
                                ) : null}

                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.post(`/studio/runs/${run.id}/clone`)
                                    }
                                >
                                    Clone run for edits
                                </Button>

                                {!isBusy &&
                                ![
                                    'awaiting_script_review',
                                    'awaiting_final_review',
                                    'failed',
                                    'approved',
                                ].includes(run.status) ? (
                                    <p className="text-sm text-muted-foreground">
                                        Pipeline is processing or idle. Use step
                                        regenerate for targeted AI updates.
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Agent assignment sidebar */}
                    <Card className="h-fit xl:sticky xl:top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Bot className="size-4" />
                                Agents for this run
                            </CardTitle>
                            <CardDescription>
                                Pick which agent profile powers each step.
                                Defaults come from Studio → Agents.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {steps.map((step) => {
                                const options =
                                    agentProfilesByStage[step.id] ?? [];
                                const value =
                                    agentForm.data.agent_profile_map[step.id] !=
                                    null
                                        ? String(
                                              agentForm.data.agent_profile_map[
                                                  step.id
                                              ],
                                          )
                                        : options.find((o) => o.isDefault)
                                            ? String(
                                                  options.find((o) => o.isDefault)!
                                                      .id,
                                              )
                                            : options[0]
                                              ? String(options[0].id)
                                              : '';

                                return (
                                    <div key={step.id} className="space-y-1.5">
                                        <Label className="text-xs">
                                            {step.label}
                                        </Label>
                                        <Select
                                            value={value}
                                            onValueChange={(v) =>
                                                agentForm.setData(
                                                    'agent_profile_map',
                                                    {
                                                        ...agentForm.data
                                                            .agent_profile_map,
                                                        [step.id]: Number(v),
                                                    },
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Default agent" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.map((opt) => (
                                                    <SelectItem
                                                        key={opt.id}
                                                        value={String(opt.id)}
                                                    >
                                                        {opt.name}
                                                        {opt.isDefault
                                                            ? ' (default)'
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            })}

                            <Button
                                className="w-full"
                                variant="secondary"
                                disabled={agentForm.processing}
                                onClick={() =>
                                    agentForm.post(
                                        `/studio/runs/${run.id}/agents`,
                                    )
                                }
                            >
                                Save agent assignments
                            </Button>

                            <p className="text-xs text-muted-foreground">
                                {xaiConfigured
                                    ? 'Live calls use XAI_API_KEY → api.x.ai (same Grok subscription).'
                                    : 'Set XAI_API_KEY in .env to enable live Grok generation.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {usage ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-none">
                            <CardHeader className="pb-2">
                                <CardDescription>Artifact kinds</CardDescription>
                                <CardTitle className="text-2xl">{usage.artifact_count}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="shadow-none">
                            <CardHeader className="pb-2">
                                <CardDescription>Versions</CardDescription>
                                <CardTitle className="text-2xl">{usage.versions}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="shadow-none">
                            <CardHeader className="pb-2">
                                <CardDescription>xAI calls</CardDescription>
                                <CardTitle className="text-2xl">{usage.xai_calls}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="shadow-none">
                            <CardHeader className="pb-2">
                                <CardDescription>Tokens (approx)</CardDescription>
                                <CardTitle className="text-2xl">{usage.total_tokens}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>
                ) : null}

                {publishChecklist.length > 0 ? (
                    <PublishChecklist items={publishChecklist} />
                ) : null}

                {episodeMedia ? (
                    <EpisodeMediaPanel
                        episodeSlug={episodeMedia.slug}
                        media={episodeMedia.media}
                    />
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Version history
                        </CardTitle>
                        <CardDescription>
                            All artifacts for this run, newest versions first per
                            kind.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-64 space-y-2 overflow-auto">
                            {run.artifacts.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                                >
                                    <span className="font-medium">
                                        {a.kind}{' '}
                                        <span className="text-muted-foreground">
                                            v{a.version}
                                        </span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {(a.meta?.source as string) ??
                                            (a.meta?.agent as string) ??
                                            a.stage ??
                                            '—'}
                                    </span>
                                </div>
                            ))}
                            {run.artifacts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No artifacts yet. Start a run from the spec
                                    page.
                                </p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
