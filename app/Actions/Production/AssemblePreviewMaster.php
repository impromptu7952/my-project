<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Actions\Media\AttachEpisodeMasterFromPath;
use App\Enums\ArtifactKind;
use App\Models\Episode;
use App\Models\MediaAsset;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Local card-film assemble: script/VTT package → temporary MP4 master via GD + ffmpeg.
 *
 * @return array{asset: MediaAsset, cards: int, duration_seconds: float, method: string, path: string}
 */
final readonly class AssemblePreviewMaster
{
    public function __construct(private AttachEpisodeMasterFromPath $attach) {}

    /**
     * @return array{asset: MediaAsset, cards: int, duration_seconds: float, method: string, path: string}
     */
    public function handle(ProductionRun $run): array
    {
        $this->assertFfmpeg();

        $run->loadMissing(['productionSpec', 'artifacts']);
        $episodeSlug = $run->productionSpec?->episode_slug;
        if (! filled($episodeSlug)) {
            throw new HttpException(422, 'Link an episode_slug on the production spec before assembling a master.');
        }

        $episode = Episode::query()->where('slug', $episodeSlug)->first();
        if ($episode === null) {
            throw new HttpException(422, "Episode [{$episodeSlug}] not found.");
        }

        $cards = $this->buildCards($run);
        if ($cards === []) {
            throw new HttpException(422, 'No script dialogue or VTT cues to assemble. Generate a script stage first.');
        }

        $work = storage_path('app/tmp/assemble-'.$run->id.'-'.Str::uuid()->toString());
        if (! mkdir($work, 0755, true) && ! is_dir($work)) {
            throw new RuntimeException('Unable to create assemble work directory.');
        }

        try {
            $clipPaths = [];
            $total = 0.0;
            foreach ($cards as $i => $card) {
                $png = $work.'/card-'.Str::padLeft((string) $i, 3, '0').'.png';
                $mp4 = $work.'/clip-'.Str::padLeft((string) $i, 3, '0').'.mp4';
                $this->renderCardPng($png, $card['text'], $card['subtitle'] ?? null, $i, count($cards));
                $duration = max(1.5, min(8.0, (float) $card['duration']));
                $total += $duration;
                $this->pngToClip($png, $mp4, $duration);
                $clipPaths[] = $mp4;
            }

            $listFile = $work.'/list.txt';
            $list = '';
            foreach ($clipPaths as $path) {
                $list .= "file '".str_replace("'", "'\\''", $path)."'\n";
            }
            file_put_contents($listFile, $list);

            $out = $work.'/master.mp4';
            $concat = Process::timeout(300)->run([
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', $listFile,
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart',
                $out,
            ]);

            if (! $concat->successful() || ! is_file($out)) {
                throw new RuntimeException('ffmpeg concat failed: '.$concat->errorOutput());
            }

            $vtt = $this->packageVtt($run) ?? $this->buildVttFromCards($cards);

            $asset = $this->attach->handle(
                $episode,
                $out,
                [
                    'source' => 'assemble_local',
                    'method' => 'gd_ffmpeg_cards',
                    'run_id' => $run->id,
                    'cards' => count($cards),
                    'duration_seconds' => round($total, 2),
                ],
                $vtt,
            );

            $meta = $run->meta ?? [];
            $meta['last_master_drive'] = [
                'method' => 'assemble_local',
                'at' => now()->toIso8601String(),
                'cards' => count($cards),
                'duration_seconds' => round($total, 2),
                'media_asset_id' => $asset->id,
            ];
            $run->update(['meta' => $meta]);

            return [
                'asset' => $asset,
                'cards' => count($cards),
                'duration_seconds' => round($total, 2),
                'method' => 'assemble_local',
                'path' => $asset->path ?? '',
            ];
        } finally {
            $this->cleanupDir($work);
        }
    }

    private function assertFfmpeg(): void
    {
        $which = Process::run(['which', 'ffmpeg']);
        if (! $which->successful()) {
            throw new HttpException(503, 'ffmpeg is not installed on this server.');
        }
    }

    /**
     * @return list<array{text: string, subtitle: ?string, duration: float}>
     */
    private function buildCards(ProductionRun $run): array
    {
        $script = $run->artifacts
            ->where('kind', ArtifactKind::Script)
            ->sortByDesc('version')
            ->first();

        $cards = [];
        if (is_array($script?->payload)) {
            $title = (string) ($script->payload['title'] ?? 'PlayZone');
            $cards[] = [
                'text' => $title,
                'subtitle' => 'PlayZone Kids · preview',
                'duration' => 3.0,
            ];

            $sections = $script->payload['sections'] ?? [];
            if (is_array($sections)) {
                foreach ($sections as $section) {
                    if (! is_array($section)) {
                        continue;
                    }
                    $sectionName = (string) ($section['name'] ?? '');
                    $sectionDur = isset($section['duration_seconds'])
                        ? (float) $section['duration_seconds']
                        : null;
                    $lines = $section['dialogue'] ?? [];
                    if (! is_array($lines) || $lines === []) {
                        continue;
                    }
                    $lineCount = count(array_filter($lines, fn ($l) => is_string($l) && trim($l) !== ''));
                    $perLine = $sectionDur && $lineCount > 0
                        ? max(2.0, $sectionDur / $lineCount)
                        : 3.5;
                    $pause = isset($section['pause_seconds']) ? (float) $section['pause_seconds'] : 0.0;

                    foreach ($lines as $idx => $line) {
                        if (! is_string($line) || trim($line) === '') {
                            continue;
                        }
                        $dur = $perLine + ($idx === $lineCount - 1 ? min(4.0, max(0.0, $pause)) : 0.0);
                        $cards[] = [
                            'text' => trim($line),
                            'subtitle' => $sectionName !== '' ? $sectionName : null,
                            'duration' => $dur,
                        ];
                    }
                }
            }
        }

        if (count($cards) <= 1) {
            $vtt = $this->packageVtt($run);
            if ($vtt !== null) {
                $fromVtt = $this->cardsFromVtt($vtt);
                if ($fromVtt !== []) {
                    $cards = array_merge(
                        [['text' => 'PlayZone Kids', 'subtitle' => 'preview', 'duration' => 2.5]],
                        $fromVtt,
                    );
                }
            }
        }

        $cards[] = [
            'text' => 'Mirupafshim!',
            'subtitle' => 'Fund · package preview',
            'duration' => 2.5,
        ];

        return array_slice($cards, 0, 40);
    }

    private function packageVtt(ProductionRun $run): ?string
    {
        $artifact = $run->artifacts
            ->where('kind', ArtifactKind::SubtitlesVtt)
            ->sortByDesc('version')
            ->first();
        if (! is_array($artifact?->payload)) {
            return null;
        }
        $vtt = $artifact->payload['vtt'] ?? $artifact->payload['subtitles_vtt'] ?? null;

        return is_string($vtt) && str_contains($vtt, 'WEBVTT') ? $vtt : null;
    }

    /**
     * @return list<array{text: string, subtitle: ?string, duration: float}>
     */
    private function cardsFromVtt(string $vtt): array
    {
        $blocks = preg_split("/\n\n+/", $vtt) ?: [];
        $cards = [];
        foreach ($blocks as $block) {
            $block = trim($block);
            if ($block === '' || str_starts_with($block, 'WEBVTT')) {
                continue;
            }
            $lines = preg_split("/\n/", $block) ?: [];
            $timing = null;
            $textLines = [];
            foreach ($lines as $line) {
                if (str_contains($line, '-->')) {
                    $timing = $line;
                    continue;
                }
                if (preg_match('/^\d+$/', trim($line))) {
                    continue;
                }
                if (trim($line) !== '') {
                    $textLines[] = trim($line);
                }
            }
            if ($textLines === []) {
                continue;
            }
            $duration = 3.0;
            if (is_string($timing) && preg_match('/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/', $timing, $m)) {
                $start = ((int) $m[1]) * 3600 + ((int) $m[2]) * 60 + (int) $m[3] + ((int) $m[4]) / 1000;
                $end = ((int) $m[5]) * 3600 + ((int) $m[6]) * 60 + (int) $m[7] + ((int) $m[8]) / 1000;
                $duration = max(1.5, min(8.0, $end - $start));
            }
            $cards[] = [
                'text' => implode(' ', $textLines),
                'subtitle' => null,
                'duration' => $duration,
            ];
        }

        return $cards;
    }

    /**
     * @param  list<array{text: string, subtitle: ?string, duration: float}>  $cards
     */
    private function buildVttFromCards(array $cards): string
    {
        $vtt = "WEBVTT\n\n";
        $t = 0.0;
        foreach ($cards as $i => $card) {
            $start = $t;
            $end = $t + $card['duration'];
            $vtt .= ($i + 1)."\n";
            $vtt .= $this->fmtTs($start).' --> '.$this->fmtTs($end)."\n";
            $vtt .= $card['text']."\n\n";
            $t = $end;
        }

        return $vtt;
    }

    private function fmtTs(float $seconds): string
    {
        $h = (int) floor($seconds / 3600);
        $m = (int) floor(fmod($seconds, 3600) / 60);
        $s = fmod($seconds, 60);

        return sprintf('%02d:%02d:%06.3f', $h, $m, $s);
    }

    private function renderCardPng(string $path, string $text, ?string $subtitle, int $index, int $total): void
    {
        $w = 1280;
        $h = 720;
        $im = imagecreatetruecolor($w, $h);
        if ($im === false) {
            throw new RuntimeException('GD imagecreatetruecolor failed.');
        }

        $palette = [
            [124, 58, 237],
            [219, 39, 119],
            [14, 165, 233],
            [234, 179, 8],
            [34, 197, 94],
            [249, 115, 22],
        ];
        $c = $palette[$index % count($palette)];
        $bg = imagecolorallocate($im, $c[0], $c[1], $c[2]);
        $white = imagecolorallocate($im, 255, 255, 255);
        $soft = imagecolorallocate($im, 255, 255, 255);
        if ($bg === false || $white === false || $soft === false) {
            throw new RuntimeException('GD color allocate failed.');
        }
        imagefill($im, 0, 0, $bg);

        // Soft circle accents (opaque lighter tint — static ffmpeg builds lack drawtext)
        $accent = imagecolorallocate(
            $im,
            min(255, $c[0] + 40),
            min(255, $c[1] + 40),
            min(255, $c[2] + 40),
        );
        if ($accent !== false) {
            imagefilledellipse($im, 180, 120, 280, 280, $accent);
            imagefilledellipse($im, 1100, 600, 320, 320, $accent);
        }

        $font = $this->fontPath();
        $bold = $this->fontBoldPath();

        if ($subtitle) {
            $this->drawCentered($im, $subtitle, $bold, 28, $soft, $w, (int) ($h * 0.28));
        }

        $this->drawWrappedCentered($im, $text, $bold, 54, $white, $w, (int) ($h * 0.48), (int) ($w * 0.82));

        $footer = sprintf('Lumi · card %d/%d · package preview', $index + 1, $total);
        $this->drawCentered($im, $footer, $font, 20, $soft, $w, (int) ($h * 0.88));

        imagepng($im, $path);
        imagedestroy($im);
    }

    /**
     * @param  \GdImage  $im
     */
    private function drawCentered($im, string $text, string $font, int $size, int $color, int $canvasW, int $y): void
    {
        $box = imagettfbbox($size, 0, $font, $text);
        if ($box === false) {
            return;
        }
        $tw = abs($box[2] - $box[0]);
        $x = (int) (($canvasW - $tw) / 2);
        imagettftext($im, $size, 0, $x, $y, $color, $font, $text);
    }

    /**
     * @param  \GdImage  $im
     */
    private function drawWrappedCentered(
        $im,
        string $text,
        string $font,
        int $size,
        int $color,
        int $canvasW,
        int $centerY,
        int $maxWidth,
    ): void {
        $words = preg_split('/\s+/u', $text) ?: [$text];
        $lines = [];
        $current = '';
        foreach ($words as $word) {
            $try = $current === '' ? $word : $current.' '.$word;
            $box = imagettfbbox($size, 0, $font, $try);
            $tw = $box ? abs($box[2] - $box[0]) : 0;
            if ($tw > $maxWidth && $current !== '') {
                $lines[] = $current;
                $current = $word;
            } else {
                $current = $try;
            }
        }
        if ($current !== '') {
            $lines[] = $current;
        }
        $lines = array_slice($lines, 0, 4);
        $lineHeight = (int) ($size * 1.35);
        $startY = $centerY - (int) (((count($lines) - 1) * $lineHeight) / 2);
        foreach ($lines as $i => $line) {
            $this->drawCentered($im, $line, $font, $size, $color, $canvasW, $startY + $i * $lineHeight);
        }
    }

    private function fontPath(): string
    {
        $candidates = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        ];
        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }
        throw new RuntimeException('No TTF font found for card rendering.');
    }

    private function fontBoldPath(): string
    {
        $candidates = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
            $this->fontPath(),
        ];
        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return $this->fontPath();
    }

    private function pngToClip(string $png, string $mp4, float $duration): void
    {
        $result = Process::timeout(120)->run([
            'ffmpeg', '-y',
            '-loop', '1',
            '-i', $png,
            '-t', sprintf('%.2f', $duration),
            '-vf', 'scale=1280:720,format=yuv420p',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-r', '25',
            $mp4,
        ]);

        if (! $result->successful() || ! is_file($mp4)) {
            throw new RuntimeException('ffmpeg clip failed: '.$result->errorOutput());
        }
    }

    private function cleanupDir(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        $files = scandir($dir);
        if ($files === false) {
            return;
        }
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $path = $dir.DIRECTORY_SEPARATOR.$file;
            if (is_file($path)) {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }
}
