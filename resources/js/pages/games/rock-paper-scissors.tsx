import { useState } from 'react';
import { GameShell } from '@/components/games/game-shell';

const CHOICES = [
    { id: 'rock', label: 'Rock', emoji: '🪨' },
    { id: 'paper', label: 'Paper', emoji: '📄' },
    { id: 'scissors', label: 'Scissors', emoji: '✂️' },
] as const;

type ChoiceId = (typeof CHOICES)[number]['id'];
type Result = 'win' | 'lose' | 'draw' | null;

function beats(a: ChoiceId, b: ChoiceId): boolean {
    return (
        (a === 'rock' && b === 'scissors') ||
        (a === 'paper' && b === 'rock') ||
        (a === 'scissors' && b === 'paper')
    );
}

function pickComputer(): ChoiceId {
    return CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
}

export default function RockPaperScissorsGame() {
    const [player, setPlayer] = useState<ChoiceId | null>(null);
    const [computer, setComputer] = useState<ChoiceId | null>(null);
    const [result, setResult] = useState<Result>(null);
    const [scores, setScores] = useState({ win: 0, lose: 0, draw: 0 });

    function play(choice: ChoiceId) {
        const cpu = pickComputer();
        setPlayer(choice);
        setComputer(cpu);

        if (choice === cpu) {
            setResult('draw');
            setScores((current) => ({ ...current, draw: current.draw + 1 }));
            return;
        }

        if (beats(choice, cpu)) {
            setResult('win');
            setScores((current) => ({ ...current, win: current.win + 1 }));
            return;
        }

        setResult('lose');
        setScores((current) => ({ ...current, lose: current.lose + 1 }));
    }

    function resetScores() {
        setScores({ win: 0, lose: 0, draw: 0 });
        setPlayer(null);
        setComputer(null);
        setResult(null);
    }

    const playerChoice = CHOICES.find((item) => item.id === player);
    const computerChoice = CHOICES.find((item) => item.id === computer);

    const resultText =
        result === 'win'
            ? 'You win! 🎉'
            : result === 'lose'
              ? 'Computer wins 🤖'
              : result === 'draw'
                ? "It's a draw 🤝"
                : 'Pick rock, paper, or scissors!';

    return (
        <GameShell
            title="Rock Paper Scissors"
            emoji="✂️"
            accent="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-sm font-bold">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                        Wins: {scores.win}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">
                        Losses: {scores.lose}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Draws: {scores.draw}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={resetScores}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                    Reset
                </button>
            </div>

            <p className="mb-6 text-center text-2xl font-black text-slate-800">
                {resultText}
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-sky-50 p-4 text-center ring-2 ring-sky-100">
                    <p className="mb-2 text-sm font-bold text-sky-700">You</p>
                    <p className="text-5xl">{playerChoice?.emoji ?? '❓'}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                        {playerChoice?.label ?? '—'}
                    </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4 text-center ring-2 ring-orange-100">
                    <p className="mb-2 text-sm font-bold text-orange-700">
                        Computer
                    </p>
                    <p className="text-5xl">{computerChoice?.emoji ?? '❓'}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                        {computerChoice?.label ?? '—'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {CHOICES.map((choice) => (
                    <button
                        key={choice.id}
                        type="button"
                        onClick={() => play(choice.id)}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-md ring-2 ring-slate-100 transition hover:scale-105 hover:ring-amber-300"
                    >
                        <span className="text-4xl sm:text-5xl">{choice.emoji}</span>
                        <span className="text-sm font-bold text-slate-700">
                            {choice.label}
                        </span>
                    </button>
                ))}
            </div>
        </GameShell>
    );
}
