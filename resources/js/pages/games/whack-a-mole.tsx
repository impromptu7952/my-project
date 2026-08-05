import { useCallback, useEffect, useRef, useState } from 'react';
import { GameShell } from '@/components/games/game-shell';

const HOLES = 9;
const GAME_SECONDS = 30;

export default function WhackAMoleGame() {
    const [active, setActive] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
    const [playing, setPlaying] = useState(false);
    const [best, setBest] = useState(0);
    const moleTimer = useRef<number | null>(null);

    const clearMoleTimer = useCallback(() => {
        if (moleTimer.current !== null) {
            window.clearTimeout(moleTimer.current);
            moleTimer.current = null;
        }
    }, []);

    const spawnMole = useCallback(() => {
        setActive(Math.floor(Math.random() * HOLES));
        clearMoleTimer();
        moleTimer.current = window.setTimeout(() => {
            setActive(null);
            moleTimer.current = window.setTimeout(spawnMole, 350);
        }, 800);
    }, [clearMoleTimer]);

    const startGame = useCallback(() => {
        clearMoleTimer();
        setScore(0);
        setTimeLeft(GAME_SECONDS);
        setPlaying(true);
        spawnMole();
    }, [clearMoleTimer, spawnMole]);

    useEffect(() => {
        if (!playing) {
            return;
        }

        if (timeLeft <= 0) {
            setPlaying(false);
            setActive(null);
            clearMoleTimer();
            setBest((current) => Math.max(current, score));
            return;
        }

        const timer = window.setTimeout(() => {
            setTimeLeft((current) => current - 1);
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [playing, timeLeft, score, clearMoleTimer]);

    useEffect(() => {
        return () => clearMoleTimer();
    }, [clearMoleTimer]);

    function whack(index: number) {
        if (!playing || active !== index) {
            return;
        }

        setScore((current) => current + 1);
        setActive(null);
        clearMoleTimer();
        moleTimer.current = window.setTimeout(spawnMole, 200);
    }

    return (
        <GameShell
            title="Whack-a-Mole"
            emoji="🐹"
            accent="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3 text-sm font-bold">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                        Score: {score}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                        Time: {timeLeft}s
                    </span>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
                        Best: {best}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={startGame}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                    {playing ? 'Restart' : 'Start'}
                </button>
            </div>

            {!playing && timeLeft === 0 && (
                <div className="mb-5 rounded-2xl bg-gradient-to-r from-yellow-200 to-lime-200 px-4 py-3 text-center text-lg font-black text-emerald-900">
                    Time&apos;s up! You scored {score} 🎉
                </div>
            )}

            {!playing && timeLeft === GAME_SECONDS && (
                <p className="mb-5 text-center text-base font-semibold text-slate-600">
                    Tap <span className="font-black">Start</span>, then whack the
                    moles as fast as you can!
                </p>
            )}

            <div className="mx-auto grid max-w-sm grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: HOLES }, (_, index) => {
                    const isUp = active === index;

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => whack(index)}
                            disabled={!playing}
                            aria-label={isUp ? 'Mole up — whack it!' : 'Empty hole'}
                            className={`relative aspect-square overflow-hidden rounded-full transition ${
                                isUp
                                    ? 'bg-lime-200 ring-4 ring-lime-400 scale-105'
                                    : 'bg-amber-900/80'
                            } ${playing ? 'cursor-pointer hover:brightness-110' : 'cursor-default opacity-80'}`}
                        >
                            <span
                                className={`absolute inset-0 flex items-center justify-center text-4xl transition duration-150 sm:text-5xl ${
                                    isUp
                                        ? 'translate-y-0 opacity-100'
                                        : 'translate-y-8 opacity-0'
                                }`}
                            >
                                🐹
                            </span>
                            {!isUp && (
                                <span className="absolute inset-x-3 bottom-3 h-3 rounded-full bg-black/30" />
                            )}
                        </button>
                    );
                })}
            </div>
        </GameShell>
    );
}
