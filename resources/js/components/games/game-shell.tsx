import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { home } from '@/routes';

type GameShellProps = {
    title: string;
    emoji: string;
    accent: string;
    children: ReactNode;
};

export function GameShell({ title, emoji, accent, children }: GameShellProps) {
    return (
        <>
            <Head title={title} />
            <div
                className={`min-h-screen ${accent} relative overflow-hidden`}
            >
                <div className="pointer-events-none absolute inset-0 opacity-30">
                    <div className="absolute top-10 left-10 size-24 rounded-full bg-white/40 blur-2xl" />
                    <div className="absolute right-16 bottom-20 size-40 rounded-full bg-white/30 blur-3xl" />
                    <div className="absolute top-1/3 right-1/4 size-16 rounded-full bg-yellow-200/50 blur-xl" />
                </div>

                <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
                    <header className="mb-6 flex items-center justify-between gap-3">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-md transition hover:scale-105 hover:bg-white focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
                        >
                            <ArrowLeft className="size-4" aria-hidden />
                            All Games
                        </Link>
                        <Link
                            href={home()}
                            className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:scale-105 hover:bg-white focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none"
                            aria-label="Home"
                        >
                            <Home className="size-4" />
                        </Link>
                    </header>

                    <div className="mb-6 text-center">
                        <div className="mb-2 text-5xl" aria-hidden>
                            {emoji}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md sm:text-4xl">
                            {title}
                        </h1>
                    </div>

                    <main className="flex flex-1 flex-col items-center">
                        <div className="w-full rounded-3xl border-4 border-white/50 bg-white/95 p-5 shadow-2xl sm:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
