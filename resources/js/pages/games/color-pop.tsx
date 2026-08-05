import { useCallback, useEffect, useState } from 'react';
import { GameShell } from '@/components/games/game-shell';

const COLORS = [
    { name: 'Red', emoji: '🔴', className: 'bg-red-400 ring-red-300' },
    { name: 'Blue', emoji: '🔵', className: 'bg-blue-400 ring-blue-300' },
    { name: 'Green', emoji: '🟢', className: 'bg-green-400 ring-green-300' },
    { name: 'Yellow', emoji: '🟡', className: 'bg-yellow-300 ring-yellow-200' },
    { name: 'Purple', emoji: '🟣', className: 'bg-purple-400 ring-purple-300' },
    { name: 'Orange', emoji: '🟠', className: 'bg-orange-400 ring-orange-300' },
] as const;

type Balloon = {
    id: number;
    colorIndex: number;
};

function randomColorIndex(exclude?: number): number {
    let next = Math.floor(Math.random() * COLORS.length);

    while (next === exclude && COLORS.length > 1) {
        next = Math.floor(Math.random() * COLORS.length);
    }

    return next;
}

function createBalloons(targetIndex: number): Balloon[] {
    const balloons: Balloon[] = [];

    // Ensure at least two targets
    balloons.push(
        { id: 0, colorIndex: targetIndex },
        { id: 1, colorIndex: targetIndex },
    );

    for (let i = 2; i < 9; i++) {
        balloons.push({
            id: i,
            colorIndex: randomColorIndex(),
        });
    }

    // Shuffle
    for (let i = balloons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balloons[i], balloons[j]] = [balloons[j], balloons[i]];
    }

    return balloons.map((balloon, index) => ({ ...balloon, id: index }));
}

export default function ColorPopGame() {
    const [targetIndex, setTargetIndex] = useState(() => randomColorIndex());
    const [balloons, setBalloons] = useState(() => createBalloons(targetIndex));
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [message, setMessage] = useState('Pop the matching balloons!');
    const [gameOver, setGameOver] = useState(false);

    const nextRound = useCallback((currentTarget?: number) => {
        const nextTarget = randomColorIndex(currentTarget);
        setTargetIndex(nextTarget);
        setBalloons(createBalloons(nextTarget));
        setMessage('Pop the matching balloons!');
    }, []);

    useEffect(() => {
        const remainingTargets = balloons.filter(
            (balloon) => balloon.colorIndex === targetIndex,
        ).length;

        if (!gameOver && balloons.length > 0 && remainingTargets === 0) {
            setScore((current) => current + 5);
            setMessage('Nice! Next round…');
            const timer = window.setTimeout(() => nextRound(targetIndex), 500);
            return () => window.clearTimeout(timer);
        }
    }, [balloons, targetIndex, gameOver, nextRound]);

    function pop(id: number) {
        if (gameOver) {
            return;
        }

        const balloon = balloons.find((item) => item.id === id);

        if (!balloon) {
            return;
        }

        if (balloon.colorIndex === targetIndex) {
            setScore((current) => current + 1);
            setBalloons((current) => current.filter((item) => item.id !== id));
            setMessage('Pop! 🎉');
            return;
        }

        setLives((current) => {
            const next = current - 1;

            if (next <= 0) {
                setGameOver(true);
                setMessage('Game over — try again!');
            } else {
                setMessage('Oops! Wrong color 😅');
            }

            return next;
        });
    }

    function restart() {
        const nextTarget = randomColorIndex();
        setTargetIndex(nextTarget);
        setBalloons(createBalloons(nextTarget));
        setScore(0);
        setLives(3);
        setMessage('Pop the matching balloons!');
        setGameOver(false);
    }

    const target = COLORS[targetIndex];

    return (
        <GameShell
            title="Color Pop"
            emoji="🎈"
            accent="bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3 text-sm font-bold">
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-700">
                        Score: {score}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                        Lives: {'❤️'.repeat(lives)}
                        {lives === 0 ? '💔' : ''}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={restart}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                    New game
                </button>
            </div>

            <div className="mb-5 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-4 text-center">
                <p className="mb-1 text-sm font-bold tracking-wide text-slate-500 uppercase">
                    Pop this color
                </p>
                <p className="text-3xl font-black text-slate-800">
                    <span aria-hidden>{target.emoji}</span> {target.name}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                    {message}
                </p>
            </div>

            {gameOver ? (
                <div className="rounded-2xl bg-slate-900 px-4 py-8 text-center text-white">
                    <p className="mb-2 text-4xl" aria-hidden>
                        🎈
                    </p>
                    <p className="mb-1 text-2xl font-black">Final score: {score}</p>
                    <button
                        type="button"
                        onClick={restart}
                        className="mt-4 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-900 transition hover:bg-pink-100"
                    >
                        Play again
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {balloons.map((balloon) => {
                        const color = COLORS[balloon.colorIndex];

                        return (
                            <button
                                key={balloon.id}
                                type="button"
                                onClick={() => pop(balloon.id)}
                                aria-label={`${color.name} balloon`}
                                className={`aspect-square rounded-full text-4xl shadow-lg ring-4 transition hover:scale-110 sm:text-5xl ${color.className}`}
                            >
                                🎈
                            </button>
                        );
                    })}
                </div>
            )}
        </GameShell>
    );
}
