<?php

declare(strict_types=1);

return [
    'default_provider' => 'self',
    'self' => [
        // Public disk for pilot HTML5 playback (static /storage URLs work with artisan serve).
        // Use MEDIA_DISK=local in production if you want private masters + signed streams only.
        'disk' => env('MEDIA_DISK', 'public'),
        'max_upload_mb' => (int) env('MEDIA_MAX_UPLOAD_MB', 512),
        'allowed_mimes' => ['video/mp4', 'video/webm'],
        'subtitle_mimes' => ['text/vtt', 'text/plain'],
        'thumbnail_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
        'audio_mimes' => ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave'],
        'path_prefix' => 'episodes',
    ],
    'embed_providers' => [
        // youtube / vimeo deferred post-pilot
    ],
];
