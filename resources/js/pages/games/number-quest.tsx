import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { GameShell } from '@/components/games/game-shell';

const MIN = 1;
const MAX = 50;

function secretNumber(): number {
    return Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
}

export default function NumberQuestGame() {
    const [secret, setSecret] = useState(() => secretNumber());
    const [guess, setGuess] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [history, setHistory] = useState<
        { value: number; hint: string }[]
    >([]);
    const [won, setWon] = useState(false);
    const [feedback, setFeedback] = useState(
        `I'm thinking of a number between ${MIN} and ${MAX}…`,
    );

    const lastHint = useMemo(
        () => history[history.length - 1]?.hint ?? null,
        [history],
    );

    function submitGuess(event: FormEvent) {
        event.preventDefault();

        if (won) {
            return;
        }

        const value = Number.parseInt(guess, 10);

        if (Number.isNaN(value) || value < MIN || value > MAX) {
            setFeedback(`Please enter a number from ${MIN} to ${MAX}.`);
            return;
        }

        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (value === secret) {
            setWon(true);
            setFeedback(`🎉 You got it in ${nextAttempts} tries!`);
            setHistory((current) => [
                ...current,
                { value, hint: 'Correct!' },
            ]);
            setGuess('');
            return;
        }

        const hint = value < secret ? 'Too low ⬆️' : 'Too high ⬇️';
        setFeedback(hint);
        setHistory((current) => [...current, { value, hint }]);
        setGuess('');
    }

    function newGame() {
        setSecret(secretNumber());
        setGuess('');
        setAttempts(0);
        setHistory([]);
        setWon(false);
        setFeedback(`I'm thinking of a number between ${MIN} and ${MAX}…`);
    }

    return (
        <GameShell
            title="Number Quest"
            emoji="🔢"
            accent="bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-800">
                    Tries: {attempts}
                </span>
                <button
                    type="button"
                    onClick={newGame}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                    New number
                </button>
            </div>

            <div
                className={`mb-6 rounded-2xl px-4 py-5 text-center ${
                    won
                        ? 'bg-gradient-to-r from-yellow-200 to-lime-200'
                        : 'bg-teal-50'
                }`}
            >
                <p className="text-xl font-black text-slate-800">{feedback}</p>
                {lastHint && !won && (
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Keep going — you can do it!
                    </p>
                )}
            </div>

            {!won && (
                <form
                    onSubmit={submitGuess}
                    className="mb-6 flex flex-col gap-3 sm:flex-row"
                >
                    <label className="sr-only" htmlFor="guess">
                        Your guess
                    </label>
                    <input
                        id="guess"
                        type="number"
                        min={MIN}
                        max={MAX}
                        value={guess}
                        onChange={(event) => setGuess(event.target.value)}
                        placeholder={`${MIN} – ${MAX}`}
                        className="min-h-12 flex-1 rounded-2xl border-2 border-teal-200 bg-white px-4 text-center text-xl font-bold text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    />
                    <button
                        type="submit"
                        className="min-h-12 rounded-2xl bg-teal-600 px-6 text-base font-black text-white transition hover:bg-teal-700"
                    >
                        Guess!
                    </button>
                </form>
            )}

            {won && (
                <button
                    type="button"
                    onClick={newGame}
                    className="mb-6 w-full rounded-2xl bg-slate-900 py-3 text-base font-black text-white transition hover:bg-slate-700"
                >
                    Play again
                </button>
            )}

            {history.length > 0 && (
                <div>
                    <h2 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
                        Guess history
                    </h2>
                    <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                        {[...history].reverse().map((item, index) => (
                            <li
                                key={`${item.value}-${index}`}
                                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                            >
                                <span>Guess: {item.value}</span>
                                <span>{item.hint}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </GameShell>
    );
}
