import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { Film, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const HEIGHT_KEY = 'studio.outputDockHeightPx';
const OPEN_KEY = 'studio.outputDockOpen';
const MIN_H = 220;
const MAX_H_RATIO = 0.75;
const DEFAULT_H = 360;

function clampHeight(h: number): number {
    if (typeof window === 'undefined') {
        return Math.max(MIN_H, Math.round(h));
    }
    const max = Math.max(
        MIN_H + 40,
        Math.floor(window.innerHeight * MAX_H_RATIO),
    );
    return Math.min(max, Math.max(MIN_H, Math.round(h)));
}

function readStoredHeight(): number {
    if (typeof window === 'undefined') {
        return DEFAULT_H;
    }
    const raw = window.localStorage.getItem(HEIGHT_KEY);
    const n = raw ? Number(raw) : DEFAULT_H;
    if (!Number.isFinite(n)) {
        return DEFAULT_H;
    }
    return clampHeight(n);
}

export function readDockOpenDefault(fallback = true): boolean {
    if (typeof window === 'undefined') {
        return fallback;
    }
    const raw = window.localStorage.getItem(OPEN_KEY);
    if (raw === '0') {
        return false;
    }
    if (raw === '1') {
        return true;
    }
    return fallback;
}

export function writeDockOpen(open: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.setItem(OPEN_KEY, open ? '1' : '0');
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hasVideo?: boolean;
    children: ReactNode;
    className?: string;
};

/**
 * Resizable bottom program monitor. Children fill height with no outer scrollbar.
 */
export function ProgramDock({
    open,
    onOpenChange,
    hasVideo = false,
    children,
    className,
}: Props) {
    const [height, setHeight] = useState(DEFAULT_H);
    const dragging = useRef(false);
    const startY = useRef(0);
    const startH = useRef(DEFAULT_H);

    useEffect(() => {
        setHeight(readStoredHeight());
    }, []);

    useEffect(() => {
        function onResize() {
            setHeight((h) => clampHeight(h));
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const persist = useCallback((h: number) => {
        const next = clampHeight(h);
        setHeight(next);
        window.localStorage.setItem(HEIGHT_KEY, String(next));
    }, []);

    useEffect(() => {
        function onMove(e: PointerEvent) {
            if (!dragging.current) {
                return;
            }
            const dy = startY.current - e.clientY;
            setHeight(clampHeight(startH.current + dy));
        }
        function onUp(e: PointerEvent) {
            if (!dragging.current) {
                return;
            }
            dragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            const dy = startY.current - e.clientY;
            persist(startH.current + dy);
        }
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, [persist]);

    const beginDrag = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            dragging.current = true;
            startY.current = e.clientY;
            startH.current = height;
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        },
        [height],
    );

    if (!open) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex shrink-0 flex-col overflow-hidden border-t bg-background',
                className,
            )}
            style={{ height }}
        >
            <div
                role="separator"
                aria-orientation="horizontal"
                aria-valuenow={height}
                aria-valuemin={MIN_H}
                aria-label="Resize program output"
                tabIndex={0}
                onPointerDown={beginDrag}
                onDoubleClick={() => {
                    const tall = clampHeight(
                        Math.floor(window.innerHeight * 0.55),
                    );
                    persist(height < tall - 40 ? tall : DEFAULT_H);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        persist(height + 28);
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        persist(height - 28);
                    } else if (e.key === 'Home') {
                        e.preventDefault();
                        persist(DEFAULT_H);
                    }
                }}
                className="group flex h-3.5 shrink-0 cursor-ns-resize items-center justify-center border-b bg-muted/40 hover:bg-primary/15 active:bg-primary/25"
                title="Drag to resize · double-click to toggle tall/default"
            >
                <GripHorizontal className="size-3.5 text-muted-foreground group-hover:text-foreground" />
            </div>

            <div className="flex h-7 shrink-0 items-center gap-2 border-b px-2">
                <Film className="size-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Program output
                </span>
                {hasVideo ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        master
                    </span>
                ) : (
                    <span className="text-[10px] text-muted-foreground">
                        no master
                    </span>
                )}
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                    {height}px
                </span>
                <div className="hidden items-center gap-0.5 sm:flex">
                    {[280, 360, 480].map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            className={cn(
                                'rounded px-1 py-0.5 text-[9px] font-medium tabular-nums',
                                height === preset
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:bg-muted/60',
                            )}
                            onClick={() => persist(preset)}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-1.5 text-[10px]"
                    onClick={() => {
                        writeDockOpen(false);
                        onOpenChange(false);
                    }}
                >
                    Hide
                </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-2">{children}</div>
        </div>
    );
}
