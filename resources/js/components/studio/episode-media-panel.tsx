import { useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type MediaItem = {
    id: number;
    kind: string;
    mimeType: string | null;
    sizeBytes: number | null;
    url: string | null;
};

type Props = {
    episodeSlug: string;
    media: MediaItem[];
    onUploaded?: () => void;
};

export function EpisodeMediaPanel({
    episodeSlug,
    media,
    onUploaded,
}: Props) {
    const form = useForm<{
        video: File | null;
        kind: string;
    }>({
        video: null,
        kind: 'video_master',
    });

    return (
        <div className="space-y-2">
            <div>
                <p className="text-[11px] font-semibold">Media</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                    {episodeSlug}
                </p>
            </div>

            <div className="space-y-1">
                {media.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                        No media yet.
                    </p>
                ) : (
                    media.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-1 rounded border px-1.5 py-1 text-[11px]"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {item.kind}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                    {item.mimeType}
                                    {item.sizeBytes
                                        ? ` · ${Math.round(item.sizeBytes / 1024)} KB`
                                        : ''}
                                </p>
                            </div>
                            {item.url ? (
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 text-[10px] font-medium text-primary hover:underline"
                                >
                                    Open
                                </a>
                            ) : null}
                        </div>
                    ))
                )}
            </div>

            <form
                className="space-y-1.5 rounded border p-1.5"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(`/studio/episodes/${episodeSlug}/media`, {
                        forceFormData: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            form.reset('video');
                            onUploaded?.();
                        },
                    });
                }}
            >
                <div className="space-y-0.5">
                    <Label className="text-[10px]">Kind</Label>
                    <Select
                        value={form.data.kind}
                        onValueChange={(v) => form.setData('kind', v)}
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="video_master">
                                Video master
                            </SelectItem>
                            <SelectItem value="subtitle">
                                Subtitles (VTT)
                            </SelectItem>
                            <SelectItem value="thumbnail">Thumbnail</SelectItem>
                            <SelectItem value="audio">Audio / VO</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-0.5">
                    <Label className="text-[10px]" htmlFor="media-file">
                        File
                    </Label>
                    <Input
                        id="media-file"
                        type="file"
                        className="h-8 text-xs"
                        onChange={(e) =>
                            form.setData(
                                'video',
                                e.target.files?.[0] ?? null,
                            )
                        }
                    />
                </div>
                <Button
                    type="submit"
                    size="sm"
                    className="h-7 w-full text-xs"
                    disabled={form.processing || !form.data.video}
                >
                    <Upload className="size-3" />
                    Upload
                </Button>
            </form>
        </div>
    );
}
