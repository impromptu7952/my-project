<?php

declare(strict_types=1);

namespace App\Services\VideoGen;

use App\Contracts\VideoGenProvider;

final class NullVideoGenProvider implements VideoGenProvider
{
    public function isConfigured(): bool
    {
        return false;
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array{path: ?string, url: ?string, meta: array<string, mixed>}
     */
    public function generate(string $prompt, array $options = []): array
    {
        return [
            'path' => null,
            'url' => null,
            'meta' => [
                'provider' => 'null',
                'error' => 'Video generation not configured. Set XAI_API_KEY for Imagine video.',
                'prompt_preview' => mb_substr($prompt, 0, 160),
            ],
        ];
    }
}
