<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Contracts\TtsProvider;
use App\Enums\ArtifactKind;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Build a TTS preview package for the latest VO cues (null provider = metadata only).
 *
 * @return array{cues: list<array<string, mixed>>, provider: string, stored_previews: int}
 */
final readonly class PreviewVoicePackage
{
    public function __construct(private TtsProvider $tts) {}

    /**
     * @return array{cues: list<array<string, mixed>>, provider: string, stored_previews: int}
     */
    public function handle(ProductionRun $run): array
    {
        $run->loadMissing('artifacts');
        $vo = $run->artifacts
            ->where('kind', ArtifactKind::VoScript)
            ->sortByDesc('version')
            ->first();
        $ttsArtifact = $run->artifacts
            ->where('kind', ArtifactKind::TtsManifest)
            ->sortByDesc('version')
            ->first();

        $lines = [];
        if (is_array($vo?->payload)) {
            $lines = $vo->payload['vo_script'] ?? [];
        }

        $manifest = is_array($ttsArtifact?->payload)
            ? ($ttsArtifact->payload['tts_manifest'] ?? $ttsArtifact->payload)
            : [];

        $cues = [];
        $stored = 0;

        if (is_array($lines) && $lines !== []) {
            foreach (array_slice($lines, 0, 40) as $i => $line) {
                if (! is_array($line)) {
                    continue;
                }
                $text = (string) ($line['line'] ?? '');
                if ($text === '') {
                    continue;
                }

                $result = $this->tts->synthesize($text, 'sq', [
                    'voice' => $manifest['voice'] ?? config('services.tts.default_voice', 'warm_female_sq'),
                    'rate' => $manifest['speaking_rate'] ?? config('services.tts.default_rate', 0.85),
                ]);

                $path = $result['path'] ?? null;
                if (is_string($path) && $path !== '') {
                    $stored++;
                } else {
                    // Persist a text preview stub for Studio so editors can audit VO sequence.
                    $disk = (string) config('services.tts.disk', config('media.self.disk', 'public'));
                    $prefix = trim((string) config('services.tts.path_prefix', 'tts-previews'), '/');
                    $rel = $prefix.'/'.$run->id.'/'.Str::padLeft((string) $i, 3, '0').'.txt';
                    Storage::disk($disk)->put($rel, $text);
                    $path = $rel;
                    $stored++;
                }

                $cues[] = [
                    'index' => $i,
                    'section_id' => $line['section_id'] ?? null,
                    'text' => $text,
                    'pause_after_seconds' => $line['pause_after_seconds'] ?? null,
                    'preview_path' => $path,
                    'meta' => $result['meta'] ?? [],
                ];
            }
        }

        return [
            'cues' => $cues,
            'provider' => (string) (($cues[0]['meta']['provider'] ?? null) ?: 'null'),
            'stored_previews' => $stored,
        ];
    }
}
