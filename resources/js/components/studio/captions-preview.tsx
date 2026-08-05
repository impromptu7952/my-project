type Props = {
    payload: unknown;
};

function extractVtt(payload: unknown): string | null {
    if (typeof payload === 'string' && payload.includes('WEBVTT')) {
        return payload;
    }
    if (payload && typeof payload === 'object') {
        const data = payload as Record<string, unknown>;
        for (const key of ['subtitles_vtt', 'vtt', 'captions']) {
            const value = data[key];
            if (typeof value === 'string' && value.includes('WEBVTT')) {
                return value;
            }
        }
    }
    return null;
}

export function CaptionsPreview({ payload }: Props) {
    const vtt = extractVtt(payload);

    if (!vtt) {
        return (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs">
                {JSON.stringify(payload ?? { note: 'No captions yet' }, null, 2)}
            </pre>
        );
    }

    const cues = vtt
        .split(/\n\n+/)
        .map((block) => block.trim())
        .filter((block) => block && !block.startsWith('WEBVTT'));

    return (
        <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground">
                VTT cues · shown on Program output when package captions are
                preferred
            </p>
            <div className="max-h-80 space-y-1 overflow-auto">
                {cues.map((cue, i) => {
                    const lines = cue.split('\n');
                    const timing = lines.find((l) => l.includes('-->')) ?? '';
                    const text = lines
                        .filter((l) => l && !l.includes('-->') && !/^\d+$/.test(l))
                        .join(' ');

                    return (
                        <div
                            key={i}
                            className="rounded border bg-muted/30 px-2 py-1 text-xs"
                        >
                            {timing ? (
                                <p className="font-mono text-[9px] text-muted-foreground">
                                    {timing}
                                </p>
                            ) : null}
                            <p className="font-medium leading-snug">
                                {text || cue}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
