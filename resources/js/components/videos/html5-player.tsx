import { useState } from 'react';

type Html5PlayerProps = {
    src: string;
    poster?: string | null;
    captionsSrc?: string | null;
    title: string;
    mimeType?: string | null;
    captionsLang?: string | null;
};

export function Html5Player({
    src,
    poster,
    captionsSrc,
    title,
    mimeType = 'video/mp4',
    captionsLang = 'sq',
}: Html5PlayerProps) {
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="overflow-hidden rounded-3xl bg-black shadow-2xl ring-4 ring-white/60">
            {error ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-black px-6 text-center text-white">
                    <p className="text-lg font-bold">Couldn’t play this video</p>
                    <p className="text-sm text-white/70">{error}</p>
                    <a
                        href={src}
                        className="mt-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Open file directly
                    </a>
                </div>
            ) : (
                <video
                    key={src}
                    className="aspect-video w-full bg-black"
                    controls
                    playsInline
                    preload="auto"
                    poster={poster ?? undefined}
                    title={title}
                    // Prefer same-origin relative /storage paths (no CORS needed).
                    onError={() =>
                        setError(
                            'The video file failed to load. Try the direct link or refresh the page.',
                        )
                    }
                >
                    <source src={src} type={mimeType ?? 'video/mp4'} />
                    {captionsSrc ? (
                        <track
                            kind="captions"
                            srcLang={captionsLang ?? 'sq'}
                            src={captionsSrc}
                            label={captionsLang === 'en' ? 'English' : 'Shqip'}
                            default
                        />
                    ) : null}
                    Your browser does not support HTML5 video.
                </video>
            )}
        </div>
    );
}
