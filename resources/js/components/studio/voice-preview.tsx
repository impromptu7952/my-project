import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Props = {
    voPayload?: unknown;
    ttsPayload?: unknown;
};

export function VoicePreview({ voPayload, ttsPayload }: Props) {
    const vo = (voPayload ?? {}) as {
        vo_script?: Array<{
            section_id?: string;
            line?: string;
            pause_after_seconds?: number;
            emphasis?: string[];
        }>;
    };
    const tts = (ttsPayload ?? {}) as {
        tts_manifest?: {
            voice?: string;
            speaking_rate?: number;
            cues?: Array<{ id?: string; text?: string; ssml_hint?: string }>;
        };
        voice?: string;
        speaking_rate?: number;
        cues?: Array<{ id?: string; text?: string }>;
    };

    const lines = vo.vo_script ?? [];
    const manifest = tts.tts_manifest ?? tts;
    const cues = manifest.cues ?? [];

    if (!lines.length && !cues.length) {
        return (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                {JSON.stringify({ vo: voPayload, tts: ttsPayload }, null, 2)}
            </pre>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {manifest.voice ? (
                    <Badge variant="secondary">Voice · {manifest.voice}</Badge>
                ) : null}
                {manifest.speaking_rate != null ? (
                    <Badge variant="outline">
                        Rate · {manifest.speaking_rate}
                    </Badge>
                ) : null}
                <Badge variant="outline">
                    TTS preview — human upload / provider later
                </Badge>
            </div>

            <div className="space-y-2">
                {lines.map((line, i) => (
                    <Card key={i} className="gap-2 py-2 shadow-none">
                        <CardHeader className="px-2.5 pb-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                {line.section_id ?? `Line ${i + 1}`}
                                {line.pause_after_seconds
                                    ? ` · pause ${line.pause_after_seconds}s`
                                    : ''}
                            </CardTitle>
                            <CardDescription className="text-sm text-foreground">
                                {line.line}
                            </CardDescription>
                        </CardHeader>
                        {(line.emphasis?.length ?? 0) > 0 ? (
                            <CardContent className="px-2.5 flex flex-wrap gap-1 pt-0">
                                {line.emphasis?.map((word) => (
                                    <Badge key={word} variant="outline">
                                        {word}
                                    </Badge>
                                ))}
                            </CardContent>
                        ) : null}
                    </Card>
                ))}
            </div>

            {cues.length > 0 ? (
                <div>
                    <p className="mb-2 text-sm font-medium">TTS cues</p>
                    <div className="space-y-1">
                        {cues.map((cue, i) => (
                            <div
                                key={cue.id ?? i}
                                className="rounded-md border px-3 py-2 text-xs"
                            >
                                <span className="font-mono text-muted-foreground">
                                    {cue.id ?? i}
                                </span>
                                <span className="ml-2">{cue.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
