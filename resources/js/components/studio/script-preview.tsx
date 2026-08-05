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
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    {editable ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Title</Label>
                                <Input
                                    value={payload.title ?? ''}
                                    onChange={(e) =>
                                        onChange?.({
                                            ...payload,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Character</Label>
                                <Input
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
                            <p className="text-lg font-semibold">
                                {payload.title ?? 'Script'}
                            </p>
                            {payload.character?.name ? (
                                <p className="text-sm text-muted-foreground">
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
                    <Button type="button" size="sm" variant="secondary" onClick={addSection}>
                        Add section
                    </Button>
                ) : null}
            </div>

            {sections.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md border bg-muted/40 px-2 py-1">
                        ~{Math.max(1, Math.round(timing.estimated / 60))} min (
                        {timing.estimated}s estimated)
                    </span>
                    <span className="rounded-md border bg-muted/40 px-2 py-1">
                        {timing.dialogueWords} words
                    </span>
                    {timing.target ? (
                        <span
                            className={cn(
                                'rounded-md border px-2 py-1',
                                Math.abs(timing.estimated - timing.target) >
                                    timing.target * 0.25
                                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                                    : 'bg-muted/40',
                            )}
                        >
                            Target {timing.target}s
                            {Math.abs(timing.estimated - timing.target) >
                            timing.target * 0.25
                                ? ' · off target'
                                : ' · on pace'}
                        </span>
                    ) : null}
                </div>
            ) : null}

            {sections.map((section, i) => (
                <Card key={section.id ?? i} className="shadow-none">
                    <CardHeader className="pb-2">
                        {editable ? (
                            <div className="grid gap-2 sm:grid-cols-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <Label>Section name</Label>
                                    <Input
                                        value={section.name ?? ''}
                                        onChange={(e) =>
                                            updateSection(i, {
                                                name: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>Duration (s)</Label>
                                    <Input
                                        type="number"
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
                                <CardTitle className="text-sm">
                                    {section.name ?? section.id ?? `Section ${i + 1}`}
                                </CardTitle>
                                <CardDescription>
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
                    <CardContent className="space-y-2 text-sm">
                        {(section.dialogue ?? []).map((line, li) =>
                            editable ? (
                                <Input
                                    key={li}
                                    value={line}
                                    onChange={(e) =>
                                        updateLine(i, li, e.target.value)
                                    }
                                    className="font-normal"
                                />
                            ) : (
                                <p key={li} className="leading-relaxed">
                                    {line}
                                </p>
                            ),
                        )}
                        {editable ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addLine(i)}
                                >
                                    Add line
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs">Pause (s)</Label>
                                    <Input
                                        type="number"
                                        className="h-8 w-20"
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
                            <p
                                className={cn(
                                    'text-xs font-medium text-primary',
                                    editable && 'pt-1',
                                )}
                            >
                                Movement: {section.movement}
                            </p>
                        ) : null}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
