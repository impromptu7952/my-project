<?php

declare(strict_types=1);

namespace App\Contracts;

interface ImageGenProvider
{
    /**
     * @param  array<string, mixed>  $options
     * @return array{path: ?string, meta: array<string, mixed>}
     */
    public function generate(string $prompt, array $options = []): array;
}
