import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="space-y-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="-ml-2 w-fit"
                    >
                        <Link href="/studio/agents">
                            <ArrowLeft />
                            All agents
                        </Link>
                    </Button>
                    <Heading
                        title={profile.name}
                        description={`Stage · ${profile.stage.replaceAll('_', ' ')} · ${profile.slug}`}
                    />
                </div>

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Agent configuration</CardTitle>
                        <CardDescription>
                            System prompt and model settings used when this
                            profile is selected on a production run.
                        </CardDescription>
                    </CardHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.put(`/studio/agents/${profile.id}`);
                        }}
                    >
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    required
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={form.data.model}
                                        onChange={(e) =>
                                            form.setData(
                                                'model',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max_tokens">Max tokens</Label>
                                    <Input
                                        id="max_tokens"
                                        type="number"
                                        value={form.data.max_tokens}
                                        onChange={(e) =>
                                            form.setData(
                                                'max_tokens',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="temperature">
                                        Temperature
                                    </Label>
                                    <Input
                                        id="temperature"
                                        type="number"
                                        step="0.05"
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

                            <div className="grid gap-2">
                                <Label htmlFor="system_prompt">
                                    System prompt
                                </Label>
                                <textarea
                                    id="system_prompt"
                                    value={form.data.system_prompt}
                                    onChange={(e) =>
                                        form.setData(
                                            'system_prompt',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className={cn(
                                        'min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs',
                                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    )}
                                />
                                <InputError
                                    message={form.errors.system_prompt}
                                />
                            </div>

                            <div className="flex flex-wrap gap-6">
                                <label className="flex items-center gap-2 text-sm">
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
                                    Default for this stage
                                </label>
                                <label className="flex items-center gap-2 text-sm">
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
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="outline" type="button" asChild>
                                <Link href="/studio/agents">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save agent'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
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
