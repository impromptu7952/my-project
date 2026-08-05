import { CheckCircle2, Circle } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Publish checklist</CardTitle>
                <CardDescription>
                    {doneCount}/{items.length} ready — complete these before going
                    live.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            'flex items-start gap-3 rounded-lg border px-3 py-2 text-sm',
                            item.done
                                ? 'border-primary/30 bg-primary/5'
                                : 'bg-muted/20',
                        )}
                    >
                        {item.done ? (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        ) : (
                            <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        )}
                        <div>
                            <p className="font-medium">{item.label}</p>
                            {item.detail ? (
                                <p className="text-xs text-muted-foreground">
                                    {item.detail}
                                </p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
