<?php

declare(strict_types=1);

namespace App\Services\Tts;

use App\Contracts\TtsProvider;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Albanian-capable TTS via Microsoft Edge neural voices (edge-tts CLI).
 *
 * Voices:
 * - sq-AL-AnilaNeural (female) — default Lumi parentese
 * - sq-AL-IlirNeural (male) — Ari / secondary
 */
final class EdgeTtsProvider implements TtsProvider
{
    public function synthesize(string $text, string $locale = 'sq', array $options = []): array
    {
        $text = trim($text);
        if ($text === '') {
            throw new RuntimeException('TTS text is empty.');
        }

        $voice = (string) ($options['voice'] ?? match ($locale) {
            'sq' => 'sq-AL-AnilaNeural',
            default => 'sq-AL-AnilaNeural',
        });
        $rate = (string) ($options['rate'] ?? '-22%');
        $pitch = (string) ($options['pitch'] ?? '+8Hz');
        $volume = (string) ($options['volume'] ?? '+0%');

        $binary = $this->resolveBinary();
        $dir = storage_path('app/tts/'.date('Ymd'));
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $filename = Str::uuid()->toString().'.mp3';
        $path = $dir.'/'.$filename;

        $result = Process::timeout(120)->run([
            $binary,
            '--voice', $voice,
            '--rate', $rate,
            '--pitch', $pitch,
            '--volume', $volume,
            '--text', $text,
            '--write-media', $path,
        ]);

        if (! $result->successful() || ! is_file($path) || filesize($path) < 200) {
            throw new RuntimeException('edge-tts failed: '.$result->errorOutput());
        }

        return [
            'path' => $path,
            'meta' => [
                'provider' => 'edge-tts',
                'voice' => $voice,
                'rate' => $rate,
                'pitch' => $pitch,
                'locale' => $locale,
                'bytes' => filesize($path),
            ],
        ];
    }

    private function resolveBinary(): string
    {
        $candidates = [
            getenv('EDGE_TTS_BINARY') ?: '',
            (string) config('services.tts.edge_binary', ''),
            $_SERVER['HOME'].'/.local/bin/edge-tts',
            'edge-tts',
        ];
        foreach ($candidates as $bin) {
            if ($bin === '') {
                continue;
            }
            if ($bin === 'edge-tts' || is_file($bin)) {
                return $bin;
            }
        }

        throw new RuntimeException('edge-tts binary not found. Install with: pipx install edge-tts');
    }
}
