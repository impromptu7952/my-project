<?php

declare(strict_types=1);

namespace App\Contracts;

interface VideoGenProvider
{
    public function isConfigured(): bool;

    /**
     * Generate a short video from a text prompt.
     *
     * @param  array<string, mixed>  $options  duration, resolution, model, etc.
     * @return array{path: ?string, url: ?string, meta: array<string, mixed>}
     */
    public function generate(string $prompt, array $options = []): array;
}
