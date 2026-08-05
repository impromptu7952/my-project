<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'xai' => [
        'api_key' => env('XAI_API_KEY'),
        'base_url' => env('XAI_BASE_URL', 'https://api.x.ai/v1'),
        // Text package agents (regen). Prefer cheaper models while iterating.
        'model' => env('XAI_MODEL', env('APP_ENV') === 'local' ? 'grok-4.3' : 'grok-4.5'),
        /*
        | UI-selectable text models for Studio package agents (Laravel AI SDK / Lab::xAI).
        | id must match api.x.ai model slugs.
        */
        'text_models' => [
            [
                'id' => 'grok-4.3',
                'label' => 'Grok 4.3',
                'hint' => 'Cheaper · good for iteration',
            ],
            [
                'id' => 'grok-4.5',
                'label' => 'Grok 4.5',
                'hint' => 'Flagship · best quality',
            ],
            [
                'id' => 'grok-4-1-fast-reasoning',
                'label' => 'Grok 4.1 Fast',
                'hint' => 'Fast · volume tier',
            ],
        ],
        /*
        | Imagine video — billed per second of generated video (not SuperGrok).
        | Official list prices (docs.x.ai, 2026):
        |   grok-imagine-video      $0.05 / sec
        |   grok-imagine-video-1.5  $0.08 / sec
        | Prefer the non-1.5 model + short duration while building.
        */
        'video_model' => env('XAI_VIDEO_MODEL', 'grok-imagine-video'),
        'video_models' => [
            [
                'id' => 'grok-imagine-video',
                'label' => 'Imagine',
                'hint' => '$0.05/s · default',
                'usd_per_sec' => (float) env('XAI_VIDEO_USD_PER_SEC', 0.05),
            ],
            [
                'id' => 'grok-imagine-video-1.5',
                'label' => 'Imagine 1.5',
                'hint' => '$0.08/s · higher quality',
                'usd_per_sec' => (float) env('XAI_VIDEO_1_5_USD_PER_SEC', 0.08),
            ],
        ],
        'video_duration' => (int) env('XAI_VIDEO_DURATION', env('APP_ENV') === 'local' ? 3 : 6),
        'video_duration_min' => (int) env('XAI_VIDEO_DURATION_MIN', 3),
        'video_duration_max' => (int) env('XAI_VIDEO_DURATION_MAX', env('APP_ENV') === 'local' ? 6 : 12),
        'video_resolution' => env('XAI_VIDEO_RESOLUTION', '480p'),
        'video_usd_per_sec' => [
            'grok-imagine-video' => (float) env('XAI_VIDEO_USD_PER_SEC', 0.05),
            'grok-imagine-video-1.5' => (float) env('XAI_VIDEO_1_5_USD_PER_SEC', 0.08),
        ],
        'max_tokens' => [
            'curriculum' => (int) env('XAI_MAX_TOKENS_CURRICULUM', 1500),
            'script' => (int) env('XAI_MAX_TOKENS_SCRIPT', env('APP_ENV') === 'local' ? 2500 : 4000),
            'storyboard' => (int) env('XAI_MAX_TOKENS_STORYBOARD', 1500),
            'visual_prompts' => (int) env('XAI_MAX_TOKENS_VISUAL', 1500),
            'voice' => (int) env('XAI_MAX_TOKENS_VOICE', 1500),
            'editor' => (int) env('XAI_MAX_TOKENS_EDITOR', 1500),
            'quality' => (int) env('XAI_MAX_TOKENS_QUALITY', 1500),
        ],
        'max_usd_per_run' => (float) env('XAI_MAX_USD_PER_RUN', 5),
    ],

    /*
    | TTS providers for Studio voice previews / episode production.
    | Default "null" keeps tests offline. Set TTS_DRIVER=edge for Albanian
    | neural voices via the edge-tts CLI (sq-AL-AnilaNeural / IlirNeural).
    */
    'tts' => [
        'driver' => env('TTS_DRIVER', 'null'),
        'edge_binary' => env('EDGE_TTS_BINARY'),
        'default_voice' => env('TTS_DEFAULT_VOICE', 'warm_female_sq'),
        'default_voice_sq' => env('TTS_VOICE_SQ', 'sq-AL-AnilaNeural'),
        'default_rate' => env('TTS_RATE', '-22%'),
        'default_pitch' => env('TTS_PITCH', '+8Hz'),
        'disk' => env('TTS_DISK', env('MEDIA_DISK', 'public')),
        'path_prefix' => 'tts-previews',
    ],

];
