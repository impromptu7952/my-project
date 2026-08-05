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
        <div className="space-y-4">
            {thumb ? (
                <Card className="shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            Thumbnail · {thumb.title ?? 'concept'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
                            Thumbnail frame (gen later)
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
                    <p className="mb-2 text-sm font-medium">Image prompts</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {images.slice(0, 12).map((item, i) => (
                            <Card key={i} className="shadow-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">
                                        {item.shot_id ?? `Image ${i + 1}`}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
                                        Still frame
                                    </div>
                                    <p className="text-xs leading-relaxed">
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
