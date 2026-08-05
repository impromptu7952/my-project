import { useCallback, useEffect, useState } from 'react';
import { GameShell } from '@/components/games/game-shell';
import { useLocale } from '@/hooks/use-locale';

const COLORS = [
    {
        key: 'red',
        nameKey: 'color.red',
        fallback: 'E kuqe',
        emoji: '🔴',
        className: 'bg-red-400 ring-red-300',
    },
    {
        key: 'blue',
        nameKey: 'color.blue',
        fallback: 'E kaltër',
        emoji: '🔵',
        className: 'bg-blue-400 ring-blue-300',
    },
    {
        key: 'yellow',
        nameKey: 'color.yellow',
        fallback: 'E verdhë',
        emoji: '🟡',
        className: 'bg-yellow-300 ring-yellow-200',
    },
    {
        key: 'green',
        nameKey: 'color.green',
        fallback: 'E gjelbër',
        emoji: '🟢',
        className: 'bg-green-400 ring-green-300',
    },
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

    balloons.push(
        { id: 0, colorIndex: targetIndex },
        { id: 1, colorIndex: targetIndex },
        { id: 2, colorIndex: targetIndex },
    );

    for (let i = 3; i < 6; i++) {
        balloons.push({
            id: i,
            colorIndex: randomColorIndex(targetIndex),
        });
    }

    for (let i = balloons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balloons[i], balloons[j]] = [balloons[j], balloons[i]];
    }

    return balloons.map((balloon, index) => ({ ...balloon, id: index }));
}

type Props = {
    watchHref?: string | null;
};

export default function ColorPopGame({ watchHref = null }: Props) {
    const { t } = useLocale();
    const [targetIndex, setTargetIndex] = useState(() => randomColorIndex());
    const [balloons, setBalloons] = useState(() => createBalloons(targetIndex));
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState(() => t('color_pop.prompt', 'Pop this color'));

    const nextRound = useCallback(
        (currentTarget?: number) => {
            const nextTarget = randomColorIndex(currentTarget);
            setTargetIndex(nextTarget);
            setBalloons(createBalloons(nextTarget));
            setMessage(t('color_pop.prompt', 'Pop this color'));
        },
        [t],
    );

    useEffect(() => {
        const remainingTargets = balloons.filter(
            (balloon) => balloon.colorIndex === targetIndex,
        ).length;

        if (balloons.length > 0 && remainingTargets === 0) {
            setScore((current) => current + 5);
            setMessage(t('color_pop.great', 'Shumë mirë!'));
            const timer = window.setTimeout(() => nextRound(targetIndex), 700);
            return () => window.clearTimeout(timer);
        }
    }, [balloons, targetIndex, nextRound, t]);

    function pop(id: number) {
        const balloon = balloons.find((item) => item.id === id);

        if (!balloon) {
            return;
        }

        if (balloon.colorIndex === targetIndex) {
            setScore((current) => current + 1);
            setBalloons((current) => current.filter((item) => item.id !== id));
            setMessage(t('color_pop.great', 'Shumë mirë!'));
            return;
        }

        // Soft fail — no hard game over
        setMessage(t('color_pop.oops', 'Provo një tjetër!'));
    }

    function restart() {
        const nextTarget = randomColorIndex();
        setTargetIndex(nextTarget);
        setBalloons(createBalloons(nextTarget));
        setScore(0);
        setMessage(t('color_pop.prompt', 'Pop this color'));
    }

    const target = COLORS[targetIndex];
    const colorName = t(target.nameKey, target.fallback);

    return (
        <GameShell
            title="Color Pop"
            emoji="🎈"
            accent="bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600"
            watchHref={watchHref ?? "/videos/ngjyrat-kuq-kalter-verdh-gjelber"}
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-3 text-sm font-bold">
                    <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-700">
                        ⭐ {score}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                        2–3 · me prind
                    </span>
                </div>
                <button
                    type="button"
                    onClick={restart}
                    className="min-h-12 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                    🔄
                </button>
            </div>

            <div className="mb-5 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-5 text-center">
                <p className="mb-1 text-sm font-bold tracking-wide text-slate-500 uppercase">
                    {t('color_pop.prompt', 'Pop this color')}
                </p>
                <p className="text-4xl font-black text-slate-800 sm:text-5xl">
                    <span aria-hidden>{target.emoji}</span> {colorName}
                </p>
                <p className="mt-3 text-lg font-bold text-fuchsia-700">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                {balloons.map((balloon) => {
                    const color = COLORS[balloon.colorIndex];
                    const label = t(color.nameKey, color.fallback);

                    return (
                        <button
                            key={balloon.id}
                            type="button"
                            onClick={() => pop(balloon.id)}
                            aria-label={label}
                            className={`flex min-h-28 aspect-square items-center justify-center rounded-full text-5xl shadow-lg ring-4 transition hover:scale-110 active:scale-95 sm:min-h-32 sm:text-6xl ${color.className}`}
                        >
                            🎈
                        </button>
                    );
                })}
            </div>
        </GameShell>
    );
}
