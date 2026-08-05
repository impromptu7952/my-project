import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Shot = {
    id?: string;
    framing?: string;
    action?: string;
    duration_seconds?: number;
    props?: string[];
    description?: string;
};

type Scene = {
    id?: string;
    section_id?: string;
    summary?: string;
    shots?: Shot[];
};

type Props = {
    payload: unknown;
};

export function StoryboardPreview({ payload }: Props) {
    if (!payload || typeof payload !== 'object') {
        return (
            <p className="text-sm text-muted-foreground">
                No storyboard yet. Generate this stage.
            </p>
        );
    }

    const data = payload as {
        scenes?: Scene[];
        shot_list?: Array<{ shot_id?: string; description?: string }>;
    };

    const scenes = data.scenes ?? [];

    if (!scenes.length) {
        return (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                {JSON.stringify(payload, null, 2)}
            </pre>
        );
    }

    return (
        <div className="space-y-2">
            {scenes.map((scene, si) => (
                <div key={scene.id ?? si} className="space-y-2">
                    <div>
                        <p className="font-semibold">
                            Scene {si + 1}
                            {scene.section_id ? ` · ${scene.section_id}` : ''}
                        </p>
                        {scene.summary ? (
                            <p className="text-sm text-muted-foreground">
                                {scene.summary}
                            </p>
                        ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(scene.shots ?? []).map((shot, shi) => (
                            <Card key={shot.id ?? shi} className="gap-2 py-2 shadow-none">
                                <CardHeader className="px-2.5 pb-0">
                                    <CardTitle className="text-sm">
                                        {shot.id ?? `Shot ${shi + 1}`}
                                    </CardTitle>
                                    <CardDescription>
                                        {shot.framing ?? 'framing n/a'}
                                        {shot.duration_seconds
                                            ? ` · ${shot.duration_seconds}s`
                                            : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-2.5 space-y-2">
                                    <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground">
                                        {shot.framing ?? 'Shot frame'}
                                    </div>
                                    <p className="text-xs leading-relaxed">
                                        {shot.action ?? shot.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {(shot.props ?? []).map((prop) => (
                                            <Badge
                                                key={prop}
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                {prop}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
