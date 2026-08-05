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

export function ScriptPreview({ payload, editable = false, onChange }: Props) {
    const sections = payload.sections ?? [];

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
