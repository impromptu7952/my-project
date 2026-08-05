import { Head, Link, usePage } from '@inertiajs/react';
import {
    Brain,
    CircleDot,
    Gamepad2,
    Palette,
    Scissors,
    Sparkles,
} from 'lucide-react';
import { dashboard, home, login, register } from '@/routes';
import {
    colorPop,
    memory,
    numberQuest,
    rockPaperScissors,
    ticTacToe,
    whackAMole,
} from '@/routes/games';

const games = [
    {
        name: 'Memory Match',
        description: 'Flip cards and find matching pairs!',
        href: memory(),
        emoji: '🧠',
        icon: Brain,
        gradient: 'from-violet-400 to-purple-600',
        ring: 'hover:ring-violet-300',
        badge: 'Memory',
        ages: 'Ages 4+',
    },
    {
        name: 'Tic-Tac-Toe',
        description: 'Get three in a row before a friend does!',
        href: ticTacToe(),
        emoji: '❌',
        icon: CircleDot,
        gradient: 'from-sky-400 to-blue-600',
        ring: 'hover:ring-sky-300',
        badge: 'Strategy',
        ages: 'Ages 5+',
    },
    {
        name: 'Whack-a-Mole',
        description: 'Tap the moles before they hide!',
        href: whackAMole(),
        emoji: '🐹',
        icon: Gamepad2,
        gradient: 'from-emerald-400 to-green-600',
        ring: 'hover:ring-emerald-300',
        badge: 'Reflexes',
        ages: 'Ages 4+',
    },
    {
        name: 'Color Pop',
        description: 'Pop balloons that match the color!',
        href: colorPop(),
        emoji: '🎈',
        icon: Palette,
        gradient: 'from-rose-400 to-pink-600',
        ring: 'hover:ring-rose-300',
        badge: 'Colors',
        ages: 'Ages 3+',
    },
    {
        name: 'Rock Paper Scissors',
        description: 'Challenge the computer in a classic duel!',
        href: rockPaperScissors(),
        emoji: '✂️',
        icon: Scissors,
        gradient: 'from-amber-400 to-orange-600',
        ring: 'hover:ring-amber-300',
        badge: 'Classic',
        ages: 'Ages 5+',
    },
    {
        name: 'Number Quest',
        description: 'Guess the secret number — higher or lower!',
        href: numberQuest(),
        emoji: '🔢',
        icon: Sparkles,
        gradient: 'from-cyan-400 to-teal-600',
        ring: 'hover:ring-cyan-300',
        badge: 'Math fun',
        ages: 'Ages 6+',
    },
] as const;

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head />
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-200 via-fuchsia-100 to-amber-100">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                    <div className="absolute -top-24 -left-16 size-72 rounded-full bg-yellow-300/50 blur-3xl" />
                    <div className="absolute top-1/4 -right-20 size-80 rounded-full bg-pink-300/40 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-cyan-300/40 blur-3xl" />
                    <div className="absolute top-12 right-1/4 animate-bounce text-4xl opacity-60 [animation-duration:3s]">
                        ⭐
                    </div>
                    <div className="absolute top-40 left-[12%] animate-bounce text-3xl opacity-50 [animation-duration:4s] [animation-delay:0.5s]">
                        🌈
                    </div>
                    <div className="absolute right-[15%] bottom-32 animate-bounce text-3xl opacity-50 [animation-duration:3.5s] [animation-delay:1s]">
                        🚀
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href={home()}
                            className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur"
                        >
                            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xl shadow">
                                🎮
                            </span>
                            <div>
                                <p className="text-sm leading-none font-black tracking-tight text-slate-800 sm:text-base">
                                    PlayZone Kids
                                </p>
                                <p className="text-xs font-medium text-slate-500">
                                    Mini games for curious minds
                                </p>
                            </div>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white hover:shadow"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white/70"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:scale-105 hover:bg-slate-800"
                                    >
                                        Join free
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="mb-10 text-center sm:mb-14">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-fuchsia-700 shadow-sm backdrop-blur">
                            <Sparkles className="size-4" aria-hidden />
                            Free · Safe · Instant play
                        </div>
                        <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                            Pick a game{' '}
                            <span className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
                                & start playing!
                            </span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-base font-medium text-slate-600 sm:text-lg">
                            Bright, simple mini games made for kids. No downloads,
                            no waiting — just tap a card and play right in your
                            browser.
                        </p>
                    </section>

                    <section aria-label="Game library">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                            {games.map((game) => {
                                const Icon = game.icon;

                                return (
                                    <Link
                                        key={game.name}
                                        href={game.href}
                                        className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white p-1 shadow-lg ring-4 ring-transparent transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${game.ring} focus-visible:ring-4 focus-visible:ring-fuchsia-300 focus-visible:outline-none`}
                                    >
                                        <div
                                            className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${game.gradient} rounded-[1.25rem]`}
                                        >
                                            <span className="text-6xl drop-shadow-md transition duration-300 group-hover:scale-110">
                                                {game.emoji}
                                            </span>
                                            <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow">
                                                {game.badge}
                                            </span>
                                            <span className="absolute top-3 right-3 rounded-full bg-black/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">
                                                {game.ages}
                                            </span>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-2 p-4">
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    className="size-4 text-slate-400"
                                                    aria-hidden
                                                />
                                                <h2 className="text-lg font-black text-slate-900">
                                                    {game.name}
                                                </h2>
                                            </div>
                                            <p className="flex-1 text-sm font-medium text-slate-500">
                                                {game.description}
                                            </p>
                                            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-fuchsia-600">
                                                Play now →
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    <footer className="mt-12 mb-4 text-center">
                        <p className="text-sm font-medium text-slate-500">
                            Made for kids · Play together · Have fun 🎉
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
