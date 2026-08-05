<?php

declare(strict_types=1);

return [
    'default_provider' => 'self',
    'self' => [
        'disk' => env('MEDIA_DISK', 'public'),
        'max_upload_mb' => (int) env('MEDIA_MAX_UPLOAD_MB', 512),
        'allowed_mimes' => ['video/mp4', 'video/webm'],
        'path_prefix' => 'episodes',
    ],
    'embed_providers' => [
        // youtube / vimeo deferred post-pilot
    ],
];
