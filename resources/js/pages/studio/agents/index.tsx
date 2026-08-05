import { Head, Link, useForm } from '@inertiajs/react';
import { Bot, Plus, Sparkles } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title="Agent profiles"
                        description="Customize the Grok-powered agents for each production step. Defaults apply to new regenerations."
                    />
                    <Badge variant={xaiConfigured ? 'default' : 'secondary'}>
                        <Sparkles className="size-3" />
                        {xaiConfigured ? 'xAI connected' : 'Stub mode'}
                    </Badge>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="space-y-6">
                        {byStage.map((group) => (
                            <Card key={group.value}>
                                <CardHeader>
                                    <CardTitle className="capitalize">
                                        {group.label}
                                    </CardTitle>
                                    <CardDescription>
                                        {group.items.length} profile
                                        {group.items.length === 1 ? '' : 's'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {group.items.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No agents for this stage yet.
                                        </p>
                                    ) : (
                                        group.items.map((profile) => (
                                            <Link
                                                key={profile.id}
                                                href={`/studio/agents/${profile.id}`}
                                                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="min-w-0">
                                                    <p className="flex items-center gap-2 font-medium">
                                                        <Bot className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {profile.name}
                                                        </span>
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {profile.model}
                                                        {profile.description
                                                            ? ` · ${profile.description}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    {profile.isDefault ? (
                                                        <Badge variant="secondary">
                                                            Default
                                                        </Badge>
                                                    ) : null}
                                                    {!profile.isActive ? (
                                                        <Badge variant="outline">
                                                            Off
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="h-fit xl:sticky xl:top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Plus className="size-4" />
                                New agent profile
                            </CardTitle>
                            <CardDescription>
                                Clone-style custom agent for a single workflow
                                step.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="space-y-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    form.post('/studio/agents');
                                }}
                            >
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={form.data.name}
                                        onChange={(e) =>
                                            form.setData('name', e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Stage</Label>
                                    <Select
                                        value={form.data.stage}
                                        onValueChange={(v) =>
                                            form.setData('stage', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages.map((s) => (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={form.data.model}
                                        onChange={(e) =>
                                            form.setData('model', e.target.value)
                                        }
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={form.processing}
                                >
                                    Create agent
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
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
