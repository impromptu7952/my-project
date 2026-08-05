<?php

declare(strict_types=1);

namespace App\Services\Xai;

/**
 * xAI connectivity helper.
 *
 * Text package generation goes through the Laravel AI SDK (Lab::xAI).
 * This client remains for isConfigured() checks. Imagine video still uses
 * VideoGenProvider (raw HTTP to api.x.ai video endpoints).
 */
final class XaiClient
{
    public function isConfigured(): bool
    {
        return filled(config('services.xai.api_key'))
            || filled(config('ai.providers.xai.key'));
    }
}
