import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
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

type Character = {
    name: string;
    role: string;
    language: string;
    dialect: string;
    age_target: string;
    tone: string[];
    look: {
        style: string;
        colors: string[];
        wardrobe: string;
        expressions: string[];
    };
    do: string[];
    dont: string[];
    sample_lines: string[];
};

export default function StudioBrand({ character }: { character: Character }) {
    return (
        <>
            <Head title="Character bible — Lumi" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="space-y-3">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
                        <Link href="/studio">
                            <ArrowLeft />
                            Studio
                        </Link>
                    </Button>
                    <Heading
                        title={`${character.name} · character bible`}
                        description={character.role}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{character.age_target}</Badge>
                        <Badge variant="outline">{character.language}</Badge>
                        <Badge variant="outline">{character.dialect}</Badge>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="size-4" />
                                Look & style
                            </CardTitle>
                            <CardDescription>{character.look.style}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Palette
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {character.look.colors.map((c) => (
                                        <Badge key={c} variant="outline">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Wardrobe
                                </p>
                                <p>{character.look.wardrobe}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Expressions
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {character.look.expressions.map((e) => (
                                        <Badge key={e} variant="secondary">
                                            {e}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Tone</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {character.tone.map((t) => (
                                <Badge key={t}>{t}</Badge>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Do</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                {character.do.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Don't</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                {character.dont.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">
                                Sample Albanian lines
                            </CardTitle>
                            <CardDescription>
                                Use these as tone anchors in agent prompts and
                                scripts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {character.sample_lines.map((line) => (
                                <Badge
                                    key={line}
                                    variant="outline"
                                    className="text-sm font-normal"
                                >
                                    {line}
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StudioBrand.layout = {
    breadcrumbs: [
        { title: 'Studio', href: '/studio' },
        { title: 'Brand bible', href: '/studio/brand' },
    ],
};
