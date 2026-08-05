import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Props = {
    payload: unknown;
};

export function CurriculumPreview({ payload }: Props) {
    if (!payload || typeof payload !== 'object') {
        return (
            <p className="text-sm text-muted-foreground">
                No curriculum package yet. Generate this stage.
            </p>
        );
    }

    const data = payload as {
        learning_goals?: string[];
        vocabulary?: Array<{
            sq?: string;
            word?: string;
            en?: string;
            props?: string[];
        }>;
        structure?: Array<{
            block?: string;
            duration_seconds?: number;
            notes?: string;
        }>;
        interaction_cues?: string[];
        safety_notes?: string[];
    };

    const goals = data.learning_goals ?? [];
    const vocab = data.vocabulary ?? [];
    const structure = data.structure ?? [];

    if (!goals.length && !vocab.length && !structure.length) {
        return (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                {JSON.stringify(payload, null, 2)}
            </pre>
        );
    }

    return (
        <div className="space-y-4">
            {goals.length > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">Learning goals</p>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                        {goals.map((g, i) => (
                            <li key={i}>{g}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {vocab.length > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">Vocabulary</p>
                    <div className="flex flex-wrap gap-2">
                        {vocab.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-sm">
                                {v.sq ?? v.word}
                                {v.en ? (
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {v.en}
                                    </span>
                                ) : null}
                            </Badge>
                        ))}
                    </div>
                </div>
            ) : null}

            {structure.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                    {structure.map((block, i) => (
                        <Card key={i} className="shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    {block.block ?? `Block ${i + 1}`}
                                </CardTitle>
                                <CardDescription>
                                    {block.duration_seconds
                                        ? `${block.duration_seconds}s`
                                        : '—'}
                                </CardDescription>
                            </CardHeader>
                            {block.notes ? (
                                <CardContent className="text-xs text-muted-foreground">
                                    {block.notes}
                                </CardContent>
                            ) : null}
                        </Card>
                    ))}
                </div>
            ) : null}

            {(data.interaction_cues?.length ?? 0) > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">Interaction cues</p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {data.interaction_cues?.map((c, i) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {(data.safety_notes?.length ?? 0) > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">Safety notes</p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {data.safety_notes?.map((c, i) => (
                            <li key={i}>{c}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
