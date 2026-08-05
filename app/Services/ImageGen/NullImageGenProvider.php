<?php

declare(strict_types=1);

namespace App\Services\ImageGen;

use App\Contracts\ImageGenProvider;

final class NullImageGenProvider implements ImageGenProvider
{
    /**
     * @param  array<string, mixed>  $options
     * @return array{path: ?string, meta: array<string, mixed>}
     */
    public function generate(string $prompt, array $options = []): array
    {
        return [
            'path' => null,
            'meta' => [
                'provider' => 'null',
                'prompt_preview' => mb_substr($prompt, 0, 120),
            ],
        ];
    }
}
