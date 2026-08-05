<?php

declare(strict_types=1);

namespace App\Services\VideoGen;

use App\Contracts\VideoGenProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * xAI Grok Imagine video generations API.
 *
 * @see https://docs.x.ai/developers/model-capabilities/video/generation
 */
final class XaiImagineVideoProvider implements VideoGenProvider
{
    public function isConfigured(): bool
    {
        return filled(config('services.xai.api_key'));
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array{path: ?string, url: ?string, meta: array<string, mixed>}
     */
    public function generate(string $prompt, array $options = []): array
    {
        if (! $this->isConfigured()) {
            return (new NullVideoGenProvider)->generate($prompt, $options);
        }

        $model = (string) ($options['model'] ?? config('services.xai.video_model', 'grok-imagine-video'));
        $duration = (int) ($options['duration'] ?? 6);
        $duration = max(3, min(15, $duration));
        $base = rtrim((string) config('services.xai.base_url', 'https://api.x.ai/v1'), '/');
        $token = (string) config('services.xai.api_key');

        $payload = [
            'model' => $model,
            'prompt' => $prompt,
            'duration' => $duration,
        ];
        if (isset($options['resolution'])) {
            $payload['resolution'] = $options['resolution'];
        }

        $start = Http::baseUrl($base)
            ->withToken($token)
            ->timeout(60)
            ->acceptJson()
            ->post('/videos/generations', $payload);

        if (! $start->successful()) {
            throw new RuntimeException(
                'Imagine video start failed ('.$start->status().'): '.$start->body()
            );
        }

        $json = $start->json();
        $requestId = $json['request_id'] ?? $json['id'] ?? null;
        if (! is_string($requestId) || $requestId === '') {
            // Some responses may return a URL immediately.
            $directUrl = $this->extractVideoUrl($json);
            if ($directUrl !== null) {
                return $this->downloadToTemp($directUrl, [
                    'provider' => 'xai_imagine',
                    'model' => $model,
                    'duration' => $duration,
                    'mode' => 'sync',
                ]);
            }
            throw new RuntimeException('Imagine video response missing request_id.');
        }

        $deadline = microtime(true) + (float) ($options['timeout'] ?? 240);
        $videoUrl = null;
        $last = [];

        while (microtime(true) < $deadline) {
            usleep(2_000_000);
            $poll = Http::baseUrl($base)
                ->withToken($token)
                ->timeout(60)
                ->acceptJson()
                ->get('/videos/'.$requestId);

            if (! $poll->successful()) {
                continue;
            }

            $last = $poll->json() ?? [];
            $status = (string) ($last['status'] ?? $last['state'] ?? '');
            $videoUrl = $this->extractVideoUrl($last);

            if ($videoUrl !== null) {
                break;
            }

            if (in_array(strtolower($status), ['failed', 'error', 'cancelled'], true)) {
                throw new RuntimeException('Imagine video failed: '.json_encode($last));
            }
        }

        if ($videoUrl === null) {
            throw new RuntimeException('Imagine video timed out waiting for result.');
        }

        return $this->downloadToTemp($videoUrl, [
            'provider' => 'xai_imagine',
            'model' => $model,
            'duration' => $duration,
            'request_id' => $requestId,
            'mode' => 'poll',
        ]);
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array{path: ?string, url: ?string, meta: array<string, mixed>}
     */
    private function downloadToTemp(string $url, array $meta): array
    {
        $response = Http::timeout(180)->get($url);
        if (! $response->successful()) {
            throw new RuntimeException('Failed to download Imagine video bytes.');
        }

        $dir = storage_path('app/tmp');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $path = $dir.'/imagine-'.Str::uuid()->toString().'.mp4';
        file_put_contents($path, $response->body());

        return [
            'path' => $path,
            'url' => $url,
            'meta' => $meta,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $json
     */
    private function extractVideoUrl(?array $json): ?string
    {
        if ($json === null) {
            return null;
        }

        foreach (['video_url', 'url', 'result_url'] as $key) {
            if (! empty($json[$key]) && is_string($json[$key])) {
                return $json[$key];
            }
        }

        if (isset($json['video']['url']) && is_string($json['video']['url'])) {
            return $json['video']['url'];
        }

        if (isset($json['data'][0]['url']) && is_string($json['data'][0]['url'])) {
            return $json['data'][0]['url'];
        }

        if (isset($json['output'][0]) && is_string($json['output'][0])) {
            return $json['output'][0];
        }

        return null;
    }
}
