import { useForm } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
};

export function EpisodeMediaPanel({ episodeSlug, media }: Props) {
    const form = useForm<{
        video: File | null;
        kind: string;
    }>({
        video: null,
        kind: 'video_master',
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Episode media</CardTitle>
                <CardDescription>
                    Upload masters, captions, thumbnails, or audio for{' '}
                    <span className="font-mono">{episodeSlug}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {media.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No media attached yet.
                        </p>
                    ) : (
                        media.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                                <div>
                                    <p className="font-medium">{item.kind}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.mimeType}
                                        {item.sizeBytes
                                            ? ` · ${Math.round(item.sizeBytes / 1024)} KB`
                                            : ''}
                                    </p>
                                </div>
                                {item.url ? (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open
                                        </a>
                                    </Button>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>

                <form
                    className="space-y-3 rounded-lg border p-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(`/studio/episodes/${episodeSlug}/media`, {
                            forceFormData: true,
                            onSuccess: () => form.reset('video'),
                        });
                    }}
                >
                    <div className="space-y-1.5">
                        <Label>Kind</Label>
                        <Select
                            value={form.data.kind}
                            onValueChange={(v) => form.setData('kind', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="video_master">
                                    Video master
                                </SelectItem>
                                <SelectItem value="subtitle">
                                    Subtitles (VTT)
                                </SelectItem>
                                <SelectItem value="thumbnail">
                                    Thumbnail
                                </SelectItem>
                                <SelectItem value="audio">Audio / VO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="media-file">File</Label>
                        <Input
                            id="media-file"
                            type="file"
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
                        disabled={form.processing || !form.data.video}
                    >
                        <Upload />
                        Upload
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
