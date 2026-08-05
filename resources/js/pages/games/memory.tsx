import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameShell } from '@/components/games/game-shell';

const EMOJIS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸'];

type Card = {
    id: number;
    emoji: string;
    matched: boolean;
};

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function createDeck(): Card[] {
    const pairs = EMOJIS.flatMap((emoji, index) => [
        { id: index * 2, emoji, matched: false },
        { id: index * 2 + 1, emoji, matched: false },
    ]);

    return shuffle(pairs);
}

export default function MemoryGame() {
    const [cards, setCards] = useState<Card[]>(() => createDeck());
    const [flipped, setFlipped] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [locked, setLocked] = useState(false);

    const matchedCount = useMemo(
        () => cards.filter((card) => card.matched).length / 2,
        [cards],
    );
    const isWon = matchedCount === EMOJIS.length;

    const reset = useCallback(() => {
        setCards(createDeck());
        setFlipped([]);
        setMoves(0);
        setLocked(false);
    }, []);

    useEffect(() => {
        if (flipped.length !== 2) {
            return;
        }

        const [firstId, secondId] = flipped;
        const first = cards.find((card) => card.id === firstId);
        const second = cards.find((card) => card.id === secondId);

        if (!first || !second) {
            return;
        }

        setLocked(true);
        setMoves((count) => count + 1);

        const timer = window.setTimeout(() => {
            if (first.emoji === second.emoji) {
                setCards((current) =>
                    current.map((card) =>
                        card.emoji === first.emoji
                            ? { ...card, matched: true }
                            : card,
                    ),
                );
            }

            setFlipped([]);
            setLocked(false);
        }, 650);

        return () => window.clearTimeout(timer);
    }, [flipped, cards]);

    function flipCard(id: number) {
        if (locked || isWon) {
            return;
        }

        const card = cards.find((item) => item.id === id);

        if (!card || card.matched || flipped.includes(id)) {
            return;
        }

        if (flipped.length >= 2) {
            return;
        }

        setFlipped((current) => [...current, id]);
    }

    return (
        <GameShell
            title="Memory Match"
            emoji="🧠"
            accent="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-3 text-sm font-bold text-slate-600">
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">
                        Moves: {moves}
                    </span>
                    <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-fuchsia-700">
                        Pairs: {matchedCount}/{EMOJIS.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={reset}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                    New game
                </button>
            </div>

            {isWon && (
                <div className="mb-5 rounded-2xl bg-gradient-to-r from-yellow-200 to-amber-200 px-4 py-3 text-center text-lg font-black text-amber-900">
                    🎉 You found them all in {moves} moves!
                </div>
            )}

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {cards.map((card) => {
                    const isFlipped =
                        card.matched || flipped.includes(card.id);

                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => flipCard(card.id)}
                            disabled={isFlipped || locked}
                            aria-label={
                                isFlipped
                                    ? `Card ${card.emoji}`
                                    : 'Hidden card'
                            }
                            className={`aspect-square rounded-2xl text-3xl font-bold shadow-md transition duration-200 sm:text-4xl ${
                                isFlipped
                                    ? 'bg-white ring-4 ring-violet-200'
                                    : 'bg-gradient-to-br from-violet-500 to-purple-700 text-white hover:scale-105'
                            } ${card.matched ? 'opacity-80' : ''}`}
                        >
                            {isFlipped ? card.emoji : '?'}
                        </button>
                    );
                })}
            </div>
        </GameShell>
    );
}
