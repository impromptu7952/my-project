<?php

declare(strict_types=1);

return [
    'default_provider' => 'self',
    'self' => [
        // Private disk by default — stream only via signed/auth routes.
        'disk' => env('MEDIA_DISK', 'local'),
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
