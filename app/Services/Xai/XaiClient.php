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
     * Chat completions against xAI (OpenAI-compatible).
     * Uses the same subscription as local Grok tooling via XAI_API_KEY.
     *
     * @param  list<array{role: string, content: string}>  $messages
     * @return array{content: string, usage: array<string, mixed>}
     */
    public function chat(
        array $messages,
        int $maxTokens = 2000,
        ?string $model = null,
        ?float $temperature = null,
    ): array {
        if (! $this->isConfigured()) {
            throw new RuntimeException('XAI_API_KEY is not configured.');
        }

        $payload = [
            'model' => $model ?? config('services.xai.model', 'grok-4.5'),
            'messages' => $messages,
            'max_tokens' => $maxTokens,
        ];

        if ($temperature !== null) {
            $payload['temperature'] = $temperature;
        }

        $response = Http::baseUrl((string) config('services.xai.base_url'))
            ->withToken((string) config('services.xai.api_key'))
            ->timeout(180)
            ->acceptJson()
            ->post('/chat/completions', $payload);

        $response->throw();

        $json = $response->json();
        $content = $json['choices'][0]['message']['content'] ?? '';

        return [
            'content' => is_string($content) ? $content : '',
            'usage' => is_array($json['usage'] ?? null) ? $json['usage'] : [],
        ];
    }
}
