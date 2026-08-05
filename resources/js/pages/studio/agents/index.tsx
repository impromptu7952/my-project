import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Profile = {
    id: number;
    slug: string;
    name: string;
    stage: string;
    description: string | null;
    model: string;
    isDefault: boolean;
    isActive: boolean;
};

type Props = {
    profiles: Profile[];
    stages: Array<{ value: string; label: string }>;
    xaiConfigured: boolean;
};

export default function StudioAgentsIndex({
    profiles,
    stages,
    xaiConfigured,
}: Props) {
    const form = useForm({
        name: '',
        stage: stages[0]?.value ?? 'script',
        description: '',
        system_prompt:
            'You are a production agent for Albanian toddler educational video. Reply with valid JSON only.',
        model: 'grok-4.5',
        max_tokens: 4000,
        temperature: 0.4,
        is_default: false,
    });

    const byStage = stages.map((stage) => ({
        ...stage,
        items: profiles.filter((p) => p.stage === stage.value),
    }));

    return (
        <>
            <Head title="Studio — Agents" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-background px-2">
                    <span className="text-xs font-semibold">Agent profiles</span>
                    <Badge
                        variant={xaiConfigured ? 'default' : 'secondary'}
                        className="h-5 gap-1 px-1.5 text-[10px]"
                    >
                        <Sparkles className="size-3" />
                        {xaiConfigured ? 'xAI' : 'Stub'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                        {profiles.length} profiles
                    </span>
                </div>

                <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[1fr_18rem]">
                    <div className="min-h-0 overflow-auto p-2">
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {byStage.map((group) => (
                                <div
                                    key={group.value}
                                    className="rounded border bg-background"
                                >
                                    <div className="flex items-center justify-between border-b px-2 py-1">
                                        <span className="text-[11px] font-semibold">
                                            {group.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {group.items.length}
                                        </span>
                                    </div>
                                    <ul className="divide-y">
                                        {group.items.length === 0 ? (
                                            <li className="px-2 py-2 text-[11px] text-muted-foreground">
                                                No agents
                                            </li>
                                        ) : (
                                            group.items.map((p) => (
                                                <li key={p.id}>
                                                    <Link
                                                        href={`/studio/agents/${p.id}`}
                                                        className="flex flex-col gap-0.5 px-2 py-1.5 hover:bg-muted/50"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span className="truncate text-xs font-medium">
                                                                {p.name}
                                                            </span>
                                                            {p.isDefault ? (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="h-4 px-1 text-[9px]"
                                                                >
                                                                    default
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                                                            {p.model}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="flex min-h-0 flex-col border-l bg-background">
                        <div className="flex h-8 shrink-0 items-center border-b px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            New agent
                        </div>
                        <form
                            className="min-h-0 flex-1 space-y-2 overflow-auto p-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/studio/agents');
                            }}
                        >
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Name</Label>
                                <Input
                                    className="h-7 text-xs"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Stage</Label>
                                <Select
                                    value={form.data.stage}
                                    onValueChange={(v) =>
                                        form.setData('stage', v)
                                    }
                                >
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                                className="text-xs"
                                            >
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Model</Label>
                                <Input
                                    className="h-7 font-mono text-xs"
                                    value={form.data.model}
                                    onChange={(e) =>
                                        form.setData('model', e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">
                                    System prompt
                                </Label>
                                <textarea
                                    className="min-h-28 w-full rounded border bg-background p-1.5 font-mono text-[10px] focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    value={form.data.system_prompt}
                                    onChange={(e) =>
                                        form.setData(
                                            'system_prompt',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <label className="flex items-center gap-1.5 text-[11px]">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_default}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_default',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Default for stage
                            </label>
                            <Button
                                type="submit"
                                size="sm"
                                className="h-7 w-full text-xs"
                                disabled={form.processing}
                            >
                                <Plus className="size-3" />
                                Create
                            </Button>
                        </form>
                    </aside>
                </div>
            </div>
        </>
    );
}

StudioAgentsIndex.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'Agents', href: '/studio/agents' },
    ],
};
