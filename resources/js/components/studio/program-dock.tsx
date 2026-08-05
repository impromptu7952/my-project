import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Film, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'studio.outputDockHeightPx';
const MIN_H = 200;
const MAX_H_RATIO = 0.72;
const DEFAULT_H = 320;

function clampHeight(h: number): number {
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : DEFAULT_H;
    if (!Number.isFinite(n)) {
        return DEFAULT_H;
    }
    return clampHeight(n);
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
    const dragRef = useRef<{ startY: number; startH: number } | null>(null);

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
        window.localStorage.setItem(STORAGE_KEY, String(next));
    }, []);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            dragRef.current = { startY: e.clientY, startH: height };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        },
        [height],
    );

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) {
            return;
        }
        const dy = dragRef.current.startY - e.clientY;
        setHeight(clampHeight(dragRef.current.startH + dy));
    }, []);

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (!dragRef.current) {
                return;
            }
            const dy = dragRef.current.startY - e.clientY;
            persist(dragRef.current.startH + dy);
            dragRef.current = null;
        },
        [persist],
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
                aria-label="Resize program output"
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        persist(height + 24);
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        persist(height - 24);
                    }
                }}
                className="group flex h-3 shrink-0 cursor-ns-resize items-center justify-center border-b bg-muted/30 hover:bg-muted/60"
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
                    drag edge · {height}px
                </span>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-1.5 text-[10px]"
                    onClick={() => onOpenChange(false)}
                >
                    Hide
                </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-2">{children}</div>
        </div>
    );
}
