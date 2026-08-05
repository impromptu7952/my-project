import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    src: string;
    poster?: string | null;
    captionsSrc?: string | null;
    packageVtt?: string | null;
    title: string;
    mimeType?: string | null;
    captionsLang?: string | null;
    /** Compact workbench chrome vs full rounded player */
    dense?: boolean;
    className?: string;
    autoPlay?: boolean;
};

/**
 * Build a same-origin blob: URL for package WEBVTT so the <track> can load
 * captions before they are published as episode media.
 */
function usePackageVttUrl(packageVtt?: string | null): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!packageVtt || !packageVtt.includes('WEBVTT')) {
            setUrl(null);
            return;
        }
        const blob = new Blob([packageVtt], { type: 'text/vtt' });
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [packageVtt]);

    return url;
}

export function StudioPlayer({
    src,
    poster,
    captionsSrc,
    packageVtt,
    title,
    mimeType = 'video/mp4',
    captionsLang = 'sq',
    dense = true,
    className,
    autoPlay = false,
}: Props) {
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const packageTrackUrl = usePackageVttUrl(packageVtt);
    const trackSrc = captionsSrc || packageTrackUrl;

    // Force media element remount when sources change (upload / refresh).
    const mediaKey = `${src}|${trackSrc ?? ''}|${poster ?? ''}`;

    useEffect(() => {
        setError(null);
    }, [mediaKey]);

    return (
        <div
            className={cn(
                'overflow-hidden bg-black',
                dense ? 'rounded-md ring-1 ring-border' : 'rounded-xl shadow-lg',
                className,
            )}
        >
            {error ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-1 bg-zinc-950 px-3 text-center text-white">
                    <p className="text-xs font-semibold">Can’t play video</p>
                    <p className="text-[10px] text-white/60">{error}</p>
                    <a
                        href={src}
                        className="mt-1 text-[10px] font-medium text-sky-300 underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Open file
                    </a>
                </div>
            ) : (
                <video
                    key={mediaKey}
                    ref={videoRef}
                    className="aspect-video w-full bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    autoPlay={autoPlay}
                    poster={poster ?? undefined}
                    title={title}
                    onError={() =>
                        setError('Load failed — re-upload or refresh media.')
                    }
                >
                    <source src={src} type={mimeType ?? 'video/mp4'} />
                    {trackSrc ? (
                        <track
                            kind="captions"
                            srcLang={captionsLang ?? 'sq'}
                            src={trackSrc}
                            label={
                                captionsLang === 'en' ? 'English' : 'Shqip'
                            }
                            default
                        />
                    ) : null}
                </video>
            )}
        </div>
    );
}
