import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type ScriptSection = {
    id?: string;
    name?: string;
    duration_seconds?: number;
    dialogue?: string[];
    pause_seconds?: number | null;
    movement?: string | null;
    on_screen_text?: string[];
};

export type ScriptPayload = {
    title?: string;
    language?: string;
    dialect?: string;
    duration_target_seconds?: number;
    character?: { name?: string; tone?: string };
    sections?: ScriptSection[];
};

type Props = {
    payload: ScriptPayload;
    editable?: boolean;
    onChange?: (next: ScriptPayload) => void;
};

function estimateSeconds(payload: ScriptPayload): {
    dialogueWords: number;
    sectionDuration: number;
    estimated: number;
    target: number | null;
} {
    const sections = payload.sections ?? [];
    let dialogueWords = 0;
    let sectionDuration = 0;
    let pauseTotal = 0;

    for (const section of sections) {
        if (typeof section.duration_seconds === 'number') {
            sectionDuration += section.duration_seconds;
        }
        if (typeof section.pause_seconds === 'number') {
            pauseTotal += section.pause_seconds;
        }
        for (const line of section.dialogue ?? []) {
            dialogueWords += line
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
        }
    }

    // Toddler pace: ~1.2s per word + explicit pauses (fallback when sections lack duration).
    const fromWords = Math.round(dialogueWords * 1.2 + pauseTotal);
    const estimated =
        sectionDuration > 0
            ? sectionDuration + pauseTotal
            : fromWords;

    return {
        dialogueWords,
        sectionDuration,
        estimated,
        target:
            typeof payload.duration_target_seconds === 'number'
                ? payload.duration_target_seconds
                : null,
    };
}

export function ScriptPreview({ payload, editable = false, onChange }: Props) {
    const sections = payload.sections ?? [];
    const timing = estimateSeconds(payload);

    function updateSection(index: number, patch: Partial<ScriptSection>) {
        if (!onChange) {
            return;
        }
        const next = structuredClone(payload);
        const list = [...(next.sections ?? [])];
        list[index] = { ...list[index], ...patch };
        next.sections = list;
        onChange(next);
    }

    function updateLine(sectionIndex: number, lineIndex: number, value: string) {
        if (!onChange) {
            return;
        }
        const next = structuredClone(payload);
        const list = [...(next.sections ?? [])];
        const dialogue = [...(list[sectionIndex]?.dialogue ?? [])];
        dialogue[lineIndex] = value;
        list[sectionIndex] = { ...list[sectionIndex], dialogue };
        next.sections = list;
        onChange(next);
    }

    function addLine(sectionIndex: number) {
        if (!onChange) {
            return;
        }
        const next = structuredClone(payload);
        const list = [...(next.sections ?? [])];
        const dialogue = [...(list[sectionIndex]?.dialogue ?? []), ''];
        list[sectionIndex] = { ...list[sectionIndex], dialogue };
        next.sections = list;
        onChange(next);
    }

    function addSection() {
        if (!onChange) {
            return;
        }
        const next = structuredClone(payload);
        next.sections = [
            ...(next.sections ?? []),
            {
                id: `section_${Date.now()}`,
                name: 'New section',
                duration_seconds: 30,
                dialogue: ['Shumë mirë!'],
                pause_seconds: 3,
            },
        ];
        onChange(next);
    }

    if (!sections.length && !editable) {
        return (
            <p className="text-sm text-muted-foreground">No script content yet.</p>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    {editable ? (
                        <div className="grid gap-1.5 sm:grid-cols-2">
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Title</Label>
                                <Input
                                    className="h-7 text-xs"
                                    value={payload.title ?? ''}
                                    onChange={(e) =>
                                        onChange?.({
                                            ...payload,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Character</Label>
                                <Input
                                    className="h-7 text-xs"
                                    value={payload.character?.name ?? ''}
                                    onChange={(e) =>
                                        onChange?.({
                                            ...payload,
                                            character: {
                                                ...payload.character,
                                                name: e.target.value,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-semibold">
                                {payload.title ?? 'Script'}
                            </p>
                            {payload.character?.name ? (
                                <p className="text-[11px] text-muted-foreground">
                                    Character: {payload.character.name}
                                    {payload.character.tone
                                        ? ` · ${payload.character.tone}`
                                        : ''}
                                </p>
                            ) : null}
                        </>
                    )}
                </div>
                {editable ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={addSection}
                    >
                        Add section
                    </Button>
                ) : null}
            </div>

            {sections.length > 0 ? (
                <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="rounded border bg-muted/40 px-1.5 py-0.5">
                        ~{Math.max(1, Math.round(timing.estimated / 60))} min (
                        {timing.estimated}s)
                    </span>
                    <span className="rounded border bg-muted/40 px-1.5 py-0.5">
                        {timing.dialogueWords} words
                    </span>
                    {timing.target ? (
                        <span
                            className={cn(
                                'rounded border px-1.5 py-0.5',
                                Math.abs(timing.estimated - timing.target) >
                                    timing.target * 0.25
                                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                                    : 'bg-muted/40',
                            )}
                        >
                            Target {timing.target}s
                            {Math.abs(timing.estimated - timing.target) >
                            timing.target * 0.25
                                ? ' · off'
                                : ' · ok'}
                        </span>
                    ) : null}
                </div>
            ) : null}

            {sections.map((section, i) => (
                <Card
                    key={section.id ?? i}
                    className="gap-2 py-2 shadow-none"
                >
                    <CardHeader className="px-2.5 pb-0">
                        {editable ? (
                            <div className="grid gap-1.5 sm:grid-cols-3">
                                <div className="space-y-0.5 sm:col-span-2">
                                    <Label className="text-[10px]">
                                        Section
                                    </Label>
                                    <Input
                                        className="h-7 text-xs"
                                        value={section.name ?? ''}
                                        onChange={(e) =>
                                            updateSection(i, {
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <Label className="text-[10px]">
                                        Duration (s)
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-7 text-xs"
                                        value={section.duration_seconds ?? 0}
                                        onChange={(e) =>
                                            updateSection(i, {
                                                duration_seconds: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <CardTitle className="text-xs">
                                    {section.name ??
                                        section.id ??
                                        `Section ${i + 1}`}
                                </CardTitle>
                                <CardDescription className="text-[10px]">
                                    {section.duration_seconds
                                        ? `${section.duration_seconds}s`
                                        : '—'}
                                    {section.pause_seconds
                                        ? ` · pause ${section.pause_seconds}s`
                                        : ''}
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-1 px-2.5 text-xs">
                        {(section.dialogue ?? []).map((line, li) =>
                            editable ? (
                                <Input
                                    key={li}
                                    value={line}
                                    onChange={(e) =>
                                        updateLine(i, li, e.target.value)
                                    }
                                    className="h-7 font-normal text-xs"
                                />
                            ) : (
                                <p key={li} className="leading-snug">
                                    {line}
                                </p>
                            ),
                        )}
                        {editable ? (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-[11px]"
                                    onClick={() => addLine(i)}
                                >
                                    Add line
                                </Button>
                                <div className="flex items-center gap-1">
                                    <Label className="text-[10px]">
                                        Pause
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-6 w-14 text-xs"
                                        value={section.pause_seconds ?? 0}
                                        onChange={(e) =>
                                            updateSection(i, {
                                                pause_seconds: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        ) : null}
                        {section.movement ? (
                            <p className="text-[10px] font-medium text-primary">
                                Movement: {section.movement}
                            </p>
                        ) : null}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
