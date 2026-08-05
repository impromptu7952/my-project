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
        'model' => env('XAI_MODEL', 'grok-4.5'),
        'video_model' => env('XAI_VIDEO_MODEL', 'grok-imagine-video'),
        'max_tokens' => [
            'curriculum' => 2000,
            'script' => 4000,
            'storyboard' => 2000,
            'visual_prompts' => 2000,
            'voice' => 2000,
            'editor' => 2000,
            'quality' => 2000,
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
