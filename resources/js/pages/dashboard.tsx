import { Head, Link, usePage } from '@inertiajs/react';
import {
    Clapperboard,
    Heart,
    History,
    MonitorPlay,
    Sparkles,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const { auth, features } = usePage().props;
    const isEditor = Boolean(auth.user?.is_editor);
    const studioEnabled = Boolean(features?.studio);

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Heading
                    title="Dashboard"
                    description="Parent and editor home for PlayZone Kids."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MonitorPlay className="size-4 text-muted-foreground" />
                                Videos
                            </CardTitle>
                            <CardDescription>
                                Browse published toddler episodes and co-view.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary">
                                <Link href="/videos">Open videos</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Heart className="size-4 text-muted-foreground" />
                                Favorites
                            </CardTitle>
                            <CardDescription>
                                Saved episodes and games for quick access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary">
                                <Link href="/parent/favorites">
                                    View favorites
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="size-4 text-muted-foreground" />
                                Watch progress
                            </CardTitle>
                            <CardDescription>
                                Resume where your little one left off.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary">
                                <Link href="/parent/progress">
                                    View progress
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {isEditor && studioEnabled ? (
                        <Card className="sm:col-span-2 xl:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clapperboard className="size-4 text-muted-foreground" />
                                    Studio
                                </CardTitle>
                                <CardDescription>
                                    Production specs, agent runs, human review
                                    gates, and publish tools for editors.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Button asChild>
                                    <Link href="/studio">Open studio</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/studio/specs/create">
                                        New production spec
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="sm:col-span-2 xl:col-span-3">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Sparkles className="size-4 text-muted-foreground" />
                                    Public home
                                </CardTitle>
                                <CardDescription>
                                    Jump back to the toddler-facing PlayZone
                                    experience anytime.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline">
                                    <Link href="/">Go to PlayZone</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
