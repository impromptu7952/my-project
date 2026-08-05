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
    return (
        <div className="overflow-hidden rounded-3xl bg-black shadow-2xl ring-4 ring-white/60">
            <video
                className="aspect-video w-full bg-black"
                controls
                playsInline
                preload="metadata"
                poster={poster ?? undefined}
                title={title}
                controlsList="nodownload"
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
        </div>
    );
}
