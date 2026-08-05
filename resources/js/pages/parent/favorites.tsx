import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
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
    favorites: Array<{ type: string; title: string | null; href: string }>;
};

export default function ParentFavorites({ favorites }: Props) {
    return (
        <>
            <Head title="Favorites" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <Heading
                    title="Favorites"
                    description="Episodes and games you saved for quick access while co-playing."
                />

                {favorites.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="size-4 text-muted-foreground" />
                                No favorites yet
                            </CardTitle>
                            <CardDescription>
                                Save videos and games from the public site to see
                                them here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="secondary">
                                <Link href="/">Browse PlayZone</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {favorites.map((fav, i) => (
                            <Link
                                key={`${fav.type}-${fav.href}-${i}`}
                                href={fav.href}
                                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Card className="h-full transition-colors group-hover:bg-muted/40">
                                    <CardHeader className="space-y-2">
                                        <Badge
                                            variant="outline"
                                            className="w-fit capitalize"
                                        >
                                            {fav.type}
                                        </Badge>
                                        <CardTitle className="text-base">
                                            {fav.title ?? 'Untitled'}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ParentFavorites.layout = {
    breadcrumbs: [{ title: 'Favorites', href: '/parent/favorites' }],
};
