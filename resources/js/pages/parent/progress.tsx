import { Head, Link } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';
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

type Props = {
    items: Array<{
        title: string | null;
        positionSeconds: number;
        durationSeconds: number | null;
        completed: boolean;
        href: string | null;
    }>;
};

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ParentProgress({ items }: Props) {
    return (
        <>
            <Head title="Watch progress" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Heading
                    title="Watch progress"
                    description="Resume where you left off on co-viewed episodes."
                />

                {items.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock3 className="size-4 text-muted-foreground" />
                                No progress yet
                            </CardTitle>
                            <CardDescription>
                                Watch an episode while signed in to track
                                progress here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary">
                                <Link href="/videos">Browse videos</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {items.map((item, i) => (
                            <Card key={`${item.title}-${i}`}>
                                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                                    <div className="space-y-1">
                                        {item.href ? (
                                            <CardTitle className="text-base">
                                                <Link
                                                    href={item.href}
                                                    className="hover:underline"
                                                >
                                                    {item.title ?? 'Episode'}
                                                </Link>
                                            </CardTitle>
                                        ) : (
                                            <CardTitle className="text-base">
                                                {item.title ?? 'Episode'}
                                            </CardTitle>
                                        )}
                                        <CardDescription>
                                            Position {formatTime(item.positionSeconds)}
                                            {item.durationSeconds
                                                ? ` / ${formatTime(item.durationSeconds)}`
                                                : ''}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            item.completed
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {item.completed
                                            ? 'Completed'
                                            : 'In progress'}
                                    </Badge>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ParentProgress.layout = {
    breadcrumbs: [{ title: 'Watch progress', href: '/parent/progress' }],
};
