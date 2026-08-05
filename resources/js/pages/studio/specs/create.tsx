import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-background px-2">
                    <span className="text-xs font-semibold">New spec</span>
                    <span className="text-[10px] text-muted-foreground">
                        Starter package for Albanian toddler episode
                    </span>
                    <div className="ml-auto flex gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            asChild
                        >
                            <Link href="/studio/specs">Cancel</Link>
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={form.processing}
                            onClick={() => {
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
                            Create
                        </Button>
                    </div>
                </div>

                <form
                    className="mx-auto grid w-full max-w-xl gap-3 overflow-auto p-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.transform((data) => ({
                            ...data,
                            spec: {
                                ...data.spec,
                                episode_slug:
                                    data.episode_slug || data.spec.episode_slug,
                            },
                        }));
                        form.post('/studio/specs');
                    }}
                >
                    <div className="space-y-0.5">
                        <Label className="text-[10px]" htmlFor="title">
                            Title
                        </Label>
                        <Input
                            id="title"
                            className="h-8 text-xs"
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.title} />
                    </div>
                    <div className="space-y-0.5">
                        <Label className="text-[10px]" htmlFor="episode_slug">
                            Episode slug
                        </Label>
                        <Input
                            id="episode_slug"
                            className="h-8 font-mono text-xs"
                            value={form.data.episode_slug}
                            onChange={(e) =>
                                form.setData('episode_slug', e.target.value)
                            }
                            placeholder="ngjyrat-kuq-kalter-verdh-gjelber"
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Links Studio output preview & publish target.
                        </p>
                        <InputError message={form.errors.episode_slug} />
                    </div>
                    <div className="rounded border bg-muted/20 p-2 text-[11px] text-muted-foreground">
                        A starter JSON package (language, age band, vocabulary,
                        structure) is attached automatically. Edit it fully after
                        create on the spec workbench.
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={form.processing}
                    >
                        Create spec
                    </Button>
                </form>
            </div>
        </>
    );
}

StudioSpecsCreate.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'Specs', href: '/studio/specs' },
        { title: 'New', href: '/studio/specs/create' },
    ],
};
