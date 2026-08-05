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
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                VTT caption preview (Albanian tracks for the watch page)
            </p>
            <div className="max-h-96 space-y-2 overflow-auto">
                {cues.map((cue, i) => {
                    const lines = cue.split('\n');
                    const timing = lines.find((l) => l.includes('-->')) ?? '';
                    const text = lines
                        .filter((l) => l && !l.includes('-->') && !/^\d+$/.test(l))
                        .join(' ');

                    return (
                        <div
                            key={i}
                            className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                        >
                            {timing ? (
                                <p className="font-mono text-[10px] text-muted-foreground">
                                    {timing}
                                </p>
                            ) : null}
                            <p className="font-medium">{text || cue}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
