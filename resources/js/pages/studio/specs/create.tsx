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

export default function StudioSpecsCreate() {
    const form = useForm({
        title: '',
        episode_slug: '',
        spec: {
            version: '1',
            language: 'sq',
            age_band: '1-3',
            episode_slug: '',
            learning_goals: ['colors'],
            vocabulary: [{ word: 'e kuqe', en: 'red' }],
            structure: [{ block: 'hello_song', duration_seconds: 60 }],
            principles: { short_phrases: true, pause_seconds: 4 },
            outputs_required: ['script'],
        },
    });

    return (
        <>
            <Head title="New production spec" />

            <div className="flex h-full flex-1 flex-col gap-3 overflow-x-auto p-2 md:p-3">
                <div className="space-y-3">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
                        <Link href="/studio/specs">
                            <ArrowLeft />
                            Back to specs
                        </Link>
                    </Button>
                    <Heading
                        title="New production spec"
                        description="Create a validated production package for an episode. Agents will use this as the source of truth."
                    />
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Spec details</CardTitle>
                        <CardDescription>
                            Title and episode slug are required. A starter JSON
                            package is attached automatically for pilot runs.
                        </CardDescription>
                    </CardHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                spec: {
                                    ...data.spec,
                                    episode_slug:
                                        data.episode_slug ||
                                        data.spec.episode_slug,
                                },
                            }));
                            form.post('/studio/specs');
                        }}
                    >
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(e) =>
                                        form.setData('title', e.target.value)
                                    }
                                    required
                                    placeholder="Ngjyrat pilot package"
                                    autoComplete="off"
                                />
                                <InputError message={form.errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="episode_slug">Episode slug</Label>
                                <Input
                                    id="episode_slug"
                                    value={form.data.episode_slug}
                                    onChange={(e) =>
                                        form.setData(
                                            'episode_slug',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="ngjyrat-kuq-kalter-verdh-gjelber"
                                    className="font-mono text-sm"
                                    autoComplete="off"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Must match a published or draft episode slug.
                                </p>
                                <InputError message={form.errors.episode_slug} />
                                <InputError message={form.errors.spec} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="outline" type="button" asChild>
                                <Link href="/studio/specs">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Creating…' : 'Create spec'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
}

StudioSpecsCreate.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'New spec', href: '/studio/specs/create' },
    ],
};
