import { Head, Link } from '@inertiajs/react';

type Props = {
    items: Array<{
        title: string | null;
        positionSeconds: number;
        durationSeconds: number | null;
        completed: boolean;
        href: string | null;
    }>;
};

export default function ParentProgress({ items }: Props) {
    return (
        <>
            <Head title="Watch progress" />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-2xl">
                    <h1 className="mb-4 text-2xl font-black">Watch progress</h1>
                    <div className="space-y-2">
                        {items.map((item, i) => (
                            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                                {item.href ? (
                                    <Link href={item.href} className="font-bold text-fuchsia-700">
                                        {item.title}
                                    </Link>
                                ) : (
                                    <p className="font-bold">{item.title}</p>
                                )}
                                <p className="text-sm text-slate-500">
                                    {item.positionSeconds}s
                                    {item.completed ? ' · completed' : ''}
                                </p>
                            </div>
                        ))}
                        {items.length === 0 ? (
                            <p className="text-slate-500">No progress yet.</p>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
