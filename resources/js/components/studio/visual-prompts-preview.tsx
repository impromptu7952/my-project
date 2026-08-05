import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type PromptItem = {
    shot_id?: string;
    prompt?: string;
    negative_prompt?: string;
    motion?: string;
};

type Props = {
    payload: unknown;
};

export function VisualPromptsPreview({ payload }: Props) {
    if (!payload || typeof payload !== 'object') {
        return (
            <p className="text-sm text-muted-foreground">
                No visual prompts yet. Generate this stage.
            </p>
        );
    }

    const data = payload as {
        image_prompts?: PromptItem[];
        video_prompts?: PromptItem[];
        thumbnail_concept?: {
            title?: string;
            prompt?: string;
            text_overlay_sq?: string;
        };
        prompts?: PromptItem[];
    };

    const images = data.image_prompts ?? data.prompts ?? [];
    const videos = data.video_prompts ?? [];
    const thumb = data.thumbnail_concept;

    if (!images.length && !videos.length && !thumb) {
        return (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                {JSON.stringify(payload, null, 2)}
            </pre>
        );
    }

    return (
        <div className="space-y-2">
            {thumb ? (
                <Card className="gap-2 py-2 shadow-none">
                    <CardHeader className="px-2.5 pb-0">
                        <CardTitle className="text-sm">
                            Thumbnail · {thumb.title ?? 'concept'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2.5 space-y-2">
                        <div className="flex h-16 items-center justify-center rounded border border-dashed bg-muted/30 text-[10px] text-muted-foreground">
                            Thumbnail (gen later)
                        </div>
                        <p className="text-xs leading-relaxed">{thumb.prompt}</p>
                        {thumb.text_overlay_sq ? (
                            <Badge variant="outline">
                                Text: {thumb.text_overlay_sq}
                            </Badge>
                        ) : null}
                    </CardContent>
                </Card>
            ) : null}

            {images.length > 0 ? (
                <div>
                    <p className="mb-1 text-[11px] font-medium">Image prompts</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                        {images.slice(0, 12).map((item, i) => (
                            <Card key={i} className="gap-1 py-1.5 shadow-none">
                                <CardHeader className="px-2 pb-0">
                                    <CardTitle className="text-[10px] font-medium text-muted-foreground">
                                        {item.shot_id ?? `Image ${i + 1}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1 px-2">
                                    <p className="text-[11px] leading-snug">
                                        {item.prompt}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : null}

            {videos.length > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">Video motion prompts</p>
                    <div className="space-y-2">
                        {videos.slice(0, 8).map((item, i) => (
                            <div
                                key={i}
                                className="rounded-lg border px-3 py-2 text-xs"
                            >
                                <p className="font-medium text-muted-foreground">
                                    {item.shot_id ?? `Motion ${i + 1}`}
                                    {item.motion ? ` · ${item.motion}` : ''}
                                </p>
                                <p className="mt-1 leading-relaxed">
                                    {item.prompt}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
