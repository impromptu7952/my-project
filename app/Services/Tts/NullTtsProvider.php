<?php

declare(strict_types=1);

namespace App\Services\Tts;

use App\Contracts\TtsProvider;

final class NullTtsProvider implements TtsProvider
{
    /**
     * @param  array<string, mixed>  $options
     * @return array{path: ?string, meta: array<string, mixed>}
     */
    public function synthesize(string $text, string $locale = 'sq', array $options = []): array
    {
        return [
            'path' => null,
            'meta' => [
                'provider' => 'null',
                'locale' => $locale,
                'characters' => mb_strlen($text),
            ],
        ];
    }
}
