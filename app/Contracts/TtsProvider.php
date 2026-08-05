<?php

declare(strict_types=1);

namespace App\Contracts;

interface TtsProvider
{
    /**
     * @param  array<string, mixed>  $options
     * @return array{path: ?string, meta: array<string, mixed>}
     */
    public function synthesize(string $text, string $locale = 'sq', array $options = []): array;
}
