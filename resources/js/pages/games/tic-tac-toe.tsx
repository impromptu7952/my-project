import { useMemo, useState } from 'react';
import { GameShell } from '@/components/games/game-shell';

type Player = 'X' | 'O';
type Cell = Player | null;

const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
] as const;

function getWinner(board: Cell[]): Player | null {
    for (const [a, b, c] of LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    return null;
}

export default function TicTacToeGame() {
    const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
    const [turn, setTurn] = useState<Player>('X');
    const [scores, setScores] = useState({ X: 0, O: 0 });

    const winner = useMemo(() => getWinner(board), [board]);
    const isDraw = !winner && board.every((cell) => cell !== null);

    function play(index: number) {
        if (board[index] || winner) {
            return;
        }

        const next = [...board];
        next[index] = turn;
        setBoard(next);

        const nextWinner = getWinner(next);

        if (nextWinner) {
            setScores((current) => ({
                ...current,
                [nextWinner]: current[nextWinner] + 1,
            }));
            return;
        }

        setTurn((current) => (current === 'X' ? 'O' : 'X'));
    }

    function resetBoard() {
        setBoard(Array(9).fill(null));
        setTurn('X');
    }

    function resetAll() {
        resetBoard();
        setScores({ X: 0, O: 0 });
    }

    const status = winner
        ? `🎉 Player ${winner} wins!`
        : isDraw
          ? "🤝 It's a draw!"
          : `Player ${turn}'s turn`;

    return (
        <GameShell
            title="Tic-Tac-Toe"
            emoji="❌"
            accent="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600"
        >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-3 text-sm font-bold">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                        X: {scores.X}
                    </span>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                        O: {scores.O}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={resetBoard}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                    >
                        Next round
                    </button>
                    <button
                        type="button"
                        onClick={resetAll}
                        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-2 ring-slate-200 transition hover:bg-slate-50"
                    >
                        Reset scores
                    </button>
                </div>
            </div>

            <p className="mb-5 text-center text-xl font-black text-slate-800">
                {status}
            </p>

            <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => play(index)}
                        disabled={Boolean(cell) || Boolean(winner)}
                        aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ''}`}
                        className={`aspect-square rounded-2xl text-4xl font-black shadow-md transition hover:scale-105 disabled:hover:scale-100 sm:text-5xl ${
                            cell === 'X'
                                ? 'bg-sky-100 text-sky-600'
                                : cell === 'O'
                                  ? 'bg-rose-100 text-rose-600'
                                  : 'bg-slate-50 text-slate-300 ring-2 ring-slate-200 hover:bg-white'
                        }`}
                    >
                        {cell ?? '·'}
                    </button>
                ))}
            </div>

            <p className="mt-5 text-center text-sm font-medium text-slate-500">
                Pass the device and take turns — X goes first each round.
            </p>
        </GameShell>
    );
}
