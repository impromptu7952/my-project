<?php

declare(strict_types=1);

namespace App\Services\Xai;

use Illuminate\Support\Facades\Http;
use RuntimeException;

final class XaiClient
{
    public function isConfigured(): bool
    {
        return filled(config('services.xai.api_key'));
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @return array{content: string, usage: array<string, mixed>}
     */
    public function chat(array $messages, int $maxTokens = 2000): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('XAI_API_KEY is not configured.');
        }

        $response = Http::baseUrl((string) config('services.xai.base_url'))
            ->withToken((string) config('services.xai.api_key'))
            ->timeout(120)
            ->post('/chat/completions', [
                'model' => config('services.xai.model', 'grok-4.5'),
                'messages' => $messages,
                'max_tokens' => $maxTokens,
            ]);

        $response->throw();

        $json = $response->json();
        $content = $json['choices'][0]['message']['content'] ?? '';

        return [
            'content' => is_string($content) ? $content : '',
            'usage' => is_array($json['usage'] ?? null) ? $json['usage'] : [],
        ];
    }
}
