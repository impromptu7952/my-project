import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChecklistItem = {
    id: string;
    label: string;
    done: boolean;
    detail?: string;
};

type Props = {
    items: ChecklistItem[];
};

export function PublishChecklist({ items }: Props) {
    const doneCount = items.filter((i) => i.done).length;

    return (
        <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">
                {doneCount}/{items.length} ready
            </p>
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        'flex items-start gap-1.5 rounded border px-1.5 py-1 text-[11px]',
                        item.done
                            ? 'border-primary/30 bg-primary/5'
                            : 'bg-muted/20',
                    )}
                >
                    {item.done ? (
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                    ) : (
                        <Circle className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                        <p className="font-medium leading-tight">{item.label}</p>
                        {item.detail ? (
                            <p className="text-[10px] text-muted-foreground">
                                {item.detail}
                            </p>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    );
}
