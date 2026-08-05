import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Profile = {
    id: number;
    slug: string;
    name: string;
    stage: string;
    description: string | null;
    systemPrompt: string;
    model: string;
    maxTokens: number;
    temperature: number;
    isDefault: boolean;
    isActive: boolean;
};

type Props = {
    profile: Profile;
    stages: Array<{ value: string; label: string }>;
};

export default function StudioAgentsEdit({ profile }: Props) {
    const form = useForm({
        name: profile.name,
        description: profile.description ?? '',
        system_prompt: profile.systemPrompt,
        model: profile.model,
        max_tokens: profile.maxTokens,
        temperature: profile.temperature,
        is_default: profile.isDefault,
        is_active: profile.isActive,
    });

    return (
        <>
            <Head title={`Agent · ${profile.name}`} />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-background px-2">
                    <span className="truncate text-xs font-semibold">
                        {form.data.name || profile.name}
                    </span>
                    <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] capitalize"
                    >
                        {profile.stage.replaceAll('_', ' ')}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <Link href="/studio/agents">Back</Link>
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={form.processing}
                            onClick={() =>
                                form.put(`/studio/agents/${profile.id}`)
                            }
                        >
                            Save
                        </Button>
                    </div>
                </div>

                <form
                    className="grid min-h-0 flex-1 gap-2 overflow-auto p-2 lg:grid-cols-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.put(`/studio/agents/${profile.id}`);
                    }}
                >
                    <div className="space-y-2">
                        <div className="space-y-0.5">
                            <Label className="text-[10px]">Name</Label>
                            <Input
                                className="h-7 text-xs"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-[10px]">Description</Label>
                            <Input
                                className="h-7 text-xs"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
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
                                    Max tokens
                                </Label>
                                <Input
                                    type="number"
                                    className="h-7 text-xs"
                                    value={form.data.max_tokens}
                                    onChange={(e) =>
                                        form.setData(
                                            'max_tokens',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[10px]">Temp</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    className="h-7 text-xs"
                                    value={form.data.temperature}
                                    onChange={(e) =>
                                        form.setData(
                                            'temperature',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-[11px]">
                            <label className="flex items-center gap-1.5">
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
                                Default
                            </label>
                            <label className="flex items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Active
                            </label>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-col space-y-0.5">
                        <Label className="text-[10px]">System prompt</Label>
                        <textarea
                            className="min-h-[20rem] flex-1 resize-none rounded border bg-background p-2 font-mono text-[11px] leading-relaxed focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            value={form.data.system_prompt}
                            onChange={(e) =>
                                form.setData('system_prompt', e.target.value)
                            }
                        />
                        <InputError message={form.errors.system_prompt} />
                    </div>
                </form>
            </div>
        </>
    );
}

StudioAgentsEdit.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'Agents', href: '/studio/agents' },
        { title: 'Edit', href: '#' },
    ],
};
