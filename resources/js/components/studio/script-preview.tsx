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
            dialogueWords += String(line)
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
        }
    }

    const fromWords = Math.round(dialogueWords * 1.2 + pauseTotal);
    const estimated =
        sectionDuration > 0 ? sectionDuration + pauseTotal : fromWords;

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

/** Normalize payload so sections/dialogue arrays always exist for editing. */
export function normalizeScriptPayload(payload: ScriptPayload): ScriptPayload {
    const sections = Array.isArray(payload.sections)
        ? payload.sections.map((section, i) => ({
              id: section.id ?? `section_${i}`,
              name: section.name ?? `Section ${i + 1}`,
              duration_seconds:
                  typeof section.duration_seconds === 'number'
                      ? section.duration_seconds
                      : 30,
              pause_seconds:
                  typeof section.pause_seconds === 'number'
                      ? section.pause_seconds
                      : 3,
              dialogue: Array.isArray(section.dialogue)
                  ? section.dialogue.map((l) => String(l ?? ''))
                  : [''],
              movement: section.movement ?? null,
              on_screen_text: section.on_screen_text,
          }))
        : [];

    return {
        ...payload,
        title: payload.title ?? '',
        character: {
            name: payload.character?.name ?? '',
            tone: payload.character?.tone,
        },
        sections,
    };
}

export function ScriptPreview({ payload, editable = false, onChange }: Props) {
    const data = normalizeScriptPayload(payload);
    const sections = data.sections ?? [];
    const timing = estimateSeconds(data);

    function commit(next: ScriptPayload) {
        onChange?.(normalizeScriptPayload(next));
    }

    function updateSection(index: number, patch: Partial<ScriptSection>) {
        if (!onChange) {
            return;
        }
        const list = [...sections];
        list[index] = { ...list[index], ...patch };
        commit({ ...data, sections: list });
    }

    function updateLine(
        sectionIndex: number,
        lineIndex: number,
        value: string,
    ) {
        if (!onChange) {
            return;
        }
        const list = [...sections];
        const dialogue = [...(list[sectionIndex]?.dialogue ?? [])];
        dialogue[lineIndex] = value;
        list[sectionIndex] = { ...list[sectionIndex], dialogue };
        commit({ ...data, sections: list });
    }

    function addLine(sectionIndex: number) {
        if (!onChange) {
            return;
        }
        const list = [...sections];
        const dialogue = [...(list[sectionIndex]?.dialogue ?? []), ''];
        list[sectionIndex] = { ...list[sectionIndex], dialogue };
        commit({ ...data, sections: list });
    }

    function removeLine(sectionIndex: number, lineIndex: number) {
        if (!onChange) {
            return;
        }
        const list = [...sections];
        const dialogue = [...(list[sectionIndex]?.dialogue ?? [])];
        if (dialogue.length <= 1) {
            dialogue[0] = '';
        } else {
            dialogue.splice(lineIndex, 1);
        }
        list[sectionIndex] = { ...list[sectionIndex], dialogue };
        commit({ ...data, sections: list });
    }

    function removeSection(index: number) {
        if (!onChange) {
            return;
        }
        const list = sections.filter((_, i) => i !== index);
        commit({ ...data, sections: list });
    }

    function addSection() {
        if (!onChange) {
            return;
        }
        commit({
            ...data,
            sections: [
                ...sections,
                {
                    id: `section_${Date.now()}`,
                    name: 'New section',
                    duration_seconds: 30,
                    dialogue: [''],
                    pause_seconds: 3,
                },
            ],
        });
    }

    if (!sections.length && !editable) {
        return (
            <p className="text-sm text-muted-foreground">
                No script content yet.
            </p>
        );
    }

    return (
        <div className="space-y-2" data-testid="script-preview">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    {editable ? (
                        <div className="grid gap-1.5 sm:grid-cols-2">
                            <div className="space-y-0.5">
                                <Label
                                    htmlFor="script-title"
                                    className="text-[10px]"
                                >
                                    Title
                                </Label>
                                <Input
                                    id="script-title"
                                    data-testid="script-title"
                                    className="h-8 text-xs"
                                    value={data.title ?? ''}
                                    onChange={(e) =>
                                        commit({
                                            ...data,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-0.5">
                                <Label
                                    htmlFor="script-character"
                                    className="text-[10px]"
                                >
                                    Character
                                </Label>
                                <Input
                                    id="script-character"
                                    data-testid="script-character"
                                    className="h-8 text-xs"
                                    value={data.character?.name ?? ''}
                                    onChange={(e) =>
                                        commit({
                                            ...data,
                                            character: {
                                                ...data.character,
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
                                {data.title || 'Script'}
                            </p>
                            {data.character?.name ? (
                                <p className="text-[11px] text-muted-foreground">
                                    Character: {data.character.name}
                                    {data.character.tone
                                        ? ` · ${data.character.tone}`
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
                        className="h-8 text-xs"
                        data-testid="script-add-section"
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
                        </span>
                    ) : null}
                </div>
            ) : null}

            {editable && sections.length === 0 ? (
                <div
                    className="rounded-md border border-dashed p-4 text-center"
                    data-testid="script-empty"
                >
                    <p className="text-xs text-muted-foreground">
                        No sections yet. Add one to start writing dialogue.
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        className="mt-2 h-8 text-xs"
                        onClick={addSection}
                    >
                        Add first section
                    </Button>
                </div>
            ) : null}

            {sections.map((section, i) => (
                <Card
                    key={section.id ?? `section-${i}`}
                    className="gap-2 py-2 shadow-none"
                    data-testid={`script-section-${i}`}
                >
                    <CardHeader className="px-2.5 pb-0">
                        {editable ? (
                            <div className="grid gap-1.5 sm:grid-cols-[1fr_5rem_auto]">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px]">
                                        Section
                                    </Label>
                                    <Input
                                        className="h-8 text-xs"
                                        data-testid={`script-section-name-${i}`}
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
                                        className="h-8 text-xs"
                                        data-testid={`script-section-duration-${i}`}
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
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-[11px] text-destructive"
                                        data-testid={`script-remove-section-${i}`}
                                        onClick={() => removeSection(i)}
                                    >
                                        Remove
                                    </Button>
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
                    <CardContent className="space-y-1.5 px-2.5 text-xs">
                        {(section.dialogue ?? ['']).map((line, li) =>
                            editable ? (
                                <div
                                    key={`${section.id ?? i}-line-${li}`}
                                    className="flex items-center gap-1"
                                >
                                    <Input
                                        data-testid={`script-line-${i}-${li}`}
                                        value={line}
                                        onChange={(e) =>
                                            updateLine(i, li, e.target.value)
                                        }
                                        placeholder="Dialogue line…"
                                        className="h-8 flex-1 text-xs font-normal"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 shrink-0 px-2 text-[11px] text-muted-foreground"
                                        data-testid={`script-remove-line-${i}-${li}`}
                                        onClick={() => removeLine(i, li)}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ) : (
                                <p
                                    key={`${section.id ?? i}-line-${li}`}
                                    className="leading-snug"
                                >
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
                                    className="h-7 text-[11px]"
                                    data-testid={`script-add-line-${i}`}
                                    onClick={() => addLine(i)}
                                >
                                    Add line
                                </Button>
                                <div className="flex items-center gap-1">
                                    <Label className="text-[10px]">Pause</Label>
                                    <Input
                                        type="number"
                                        className="h-7 w-16 text-xs"
                                        data-testid={`script-pause-${i}`}
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

            {editable ? (
                <p className="text-[10px] text-muted-foreground">
                    Edits update the draft. Click <strong>Save</strong> in the
                    step toolbar to create a new script version.
                </p>
            ) : null}
        </div>
    );
}
