import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    src: string;
    poster?: string | null;
    captionsSrc?: string | null;
    packageVtt?: string | null;
    /** Prefer package VTT over episode media captions (live package preview). */
    preferPackageVtt?: boolean;
    title: string;
    mimeType?: string | null;
    captionsLang?: string | null;
    dense?: boolean;
    /**
     * Fill parent height (flex). Video object-contain, no aspect-ratio box.
     * Parent must have a definite height.
     */
    fill?: boolean;
    className?: string;
    autoPlay?: boolean;
};

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
    preferPackageVtt = false,
    title,
    mimeType = 'video/mp4',
    captionsLang = 'sq',
    dense = true,
    fill = false,
    className,
    autoPlay = false,
}: Props) {
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const packageTrackUrl = usePackageVttUrl(packageVtt);

    const trackSrc =
        preferPackageVtt && packageTrackUrl
            ? packageTrackUrl
            : captionsSrc || packageTrackUrl;

    const mediaKey = `${src}|${trackSrc ?? ''}|${poster ?? ''}|${preferPackageVtt ? 'pkg' : 'med'}`;

    useEffect(() => {
        setError(null);
    }, [mediaKey]);

    // Try to enable captions when track is attached.
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !trackSrc) {
            return;
        }
        const enable = () => {
            const tracks = video.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = i === 0 ? 'showing' : 'disabled';
            }
        };
        video.addEventListener('loadedmetadata', enable);
        enable();
        return () => video.removeEventListener('loadedmetadata', enable);
    }, [mediaKey, trackSrc]);

    return (
        <div
            className={cn(
                'overflow-hidden bg-black',
                dense ? 'rounded-md ring-1 ring-border' : 'rounded-xl shadow-lg',
                fill && 'flex h-full min-h-0 w-full flex-col',
                className,
            )}
        >
            {error ? (
                <div
                    className={cn(
                        'flex flex-col items-center justify-center gap-1 bg-zinc-950 px-3 text-center text-white',
                        fill ? 'h-full min-h-0' : 'aspect-video',
                    )}
                >
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
                    className={cn(
                        'bg-black',
                        fill
                            ? 'h-full min-h-0 w-full flex-1 object-contain'
                            : 'aspect-video w-full',
                    )}
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

export function extractVttFromPayload(payload: unknown): string | null {
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
