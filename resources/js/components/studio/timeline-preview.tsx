import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Props = {
    editPayload?: unknown;
    onScreenPayload?: unknown;
};

export function TimelinePreview({ editPayload, onScreenPayload }: Props) {
    const edit = (editPayload ?? {}) as {
        edit_instructions?: Array<{
            timecode_in?: string;
            timecode_out?: string;
            action?: string;
        }>;
    };
    const onScreen = (onScreenPayload ?? {}) as {
        on_screen_text?: Array<{ time?: string; text_sq?: string }>;
    };

    const instructions = edit.edit_instructions ?? [];
    const texts = onScreen.on_screen_text ?? [];

    if (!instructions.length && !texts.length) {
        return (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                {JSON.stringify(
                    { edit: editPayload, on_screen: onScreenPayload },
                    null,
                    2,
                )}
            </pre>
        );
    }

    return (
        <div className="space-y-2">
            {instructions.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-sm font-medium">Edit timeline</p>
                    {instructions.map((row, i) => (
                        <Card key={i} className="gap-2 py-2 shadow-none">
                            <CardHeader className="px-2.5 pb-0">
                                <CardTitle className="font-mono text-xs">
                                    {row.timecode_in ?? '??'} →{' '}
                                    {row.timecode_out ?? '??'}
                                </CardTitle>
                                <CardDescription>{row.action}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : null}

            {texts.length > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">On-screen text</p>
                    <div className="space-y-1">
                        {texts.map((row, i) => (
                            <div
                                key={i}
                                className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                                <Badge variant="outline" className="font-mono">
                                    {row.time ?? '—'}
                                </Badge>
                                <span>{row.text_sq}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
