import { useCallback, useState } from 'react';
import { GameShell } from '@/components/games/game-shell';
import { useLocale } from '@/hooks/use-locale';

type Shape = {
    id: number;
    x: number;
    y: number;
    size: number;
    emoji: string;
    color: string;
};

const EMOJIS = ['⭐', '🔵', '💛', '🟢', '❤️', '🟣', '🌟', '🟠'];
const COLORS = [
    'bg-rose-300',
    'bg-sky-300',
    'bg-amber-300',
    'bg-emerald-300',
    'bg-violet-300',
    'bg-orange-300',
];

function playBeep(frequency = 520): void {
    try {
        const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        if (!Ctx) {
            return;
        }
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.stop(ctx.currentTime + 0.25);
        window.setTimeout(() => void ctx.close(), 400);
    } catch {
        // Audio optional
    }
}

export default function TouchAndTapGame() {
    const { t } = useLocale();
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [taps, setTaps] = useState(0);

    const spawn = useCallback((clientX?: number, clientY?: number, rect?: DOMRect) => {
        const x =
            clientX !== undefined && rect
                ? ((clientX - rect.left) / rect.width) * 100
                : 15 + Math.random() * 70;
        const y =
            clientY !== undefined && rect
                ? ((clientY - rect.top) / rect.height) * 100
                : 15 + Math.random() * 70;

        const shape: Shape = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            x: Math.min(90, Math.max(5, x)),
            y: Math.min(90, Math.max(5, y)),
            size: 64 + Math.floor(Math.random() * 56),
            emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };

        setShapes((current) => [...current.slice(-12), shape]);
        setTaps((n) => n + 1);
        playBeep(400 + Math.random() * 400);

        window.setTimeout(() => {
            setShapes((current) => current.filter((item) => item.id !== shape.id));
        }, 1800);
    }, []);

    return (
        <GameShell
            title="Touch & Tap"
            emoji="👆"
            accent="bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400"
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                    1–2 · me prind
                </p>
                <p className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-800">
                    ✨ {taps}
                </p>
            </div>

            <p className="mb-4 text-center text-xl font-black text-slate-700">
                {t('touch_tap.hint', 'Prek kudo!')}
            </p>

            <button
                type="button"
                className="relative min-h-[55vh] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-fuchsia-50 to-amber-100 shadow-inner ring-4 ring-orange-200 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-orange-300"
                onPointerDown={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    spawn(event.clientX, event.clientY, rect);
                }}
                aria-label={t('touch_tap.hint', 'Tap anywhere')}
            >
                {shapes.map((shape) => (
                    <span
                        key={shape.id}
                        className={`pointer-events-none absolute flex items-center justify-center rounded-full shadow-lg transition duration-500 ${shape.color}`}
                        style={{
                            left: `${shape.x}%`,
                            top: `${shape.y}%`,
                            width: shape.size,
                            height: shape.size,
                            transform: 'translate(-50%, -50%) scale(1)',
                        }}
                        aria-hidden
                    >
                        <span className="text-3xl sm:text-4xl">{shape.emoji}</span>
                    </span>
                ))}

                {shapes.length === 0 ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl opacity-40">
                        👆
                    </span>
                ) : null}
            </button>
        </GameShell>
    );
}
