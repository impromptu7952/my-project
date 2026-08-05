import { Head, Link } from '@inertiajs/react';

type Props = {
    favorites: Array<{ type: string; title: string | null; href: string }>;
};

export default function ParentFavorites({ favorites }: Props) {
    return (
        <>
            <Head title="Favorites" />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-2xl">
                    <h1 className="mb-4 text-2xl font-black">Parent favorites</h1>
                    <div className="space-y-2">
                        {favorites.map((fav, i) => (
                            <Link
                                key={i}
                                href={fav.href}
                                className="block rounded-xl bg-white p-4 shadow-sm"
                            >
                                <span className="text-xs font-bold uppercase text-slate-400">
                                    {fav.type}
                                </span>
                                <p className="font-bold">{fav.title}</p>
                            </Link>
                        ))}
                        {favorites.length === 0 ? (
                            <p className="text-slate-500">No favorites yet.</p>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
