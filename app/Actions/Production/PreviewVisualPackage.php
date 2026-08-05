<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Contracts\ImageGenProvider;
use App\Enums\ArtifactKind;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Build image-gen preview stubs from the latest image prompts (null provider = metadata only).
 *
 * @return array{prompts: list<array<string, mixed>>, provider: string, stored_previews: int}
 */
final readonly class PreviewVisualPackage
{
    public function __construct(private ImageGenProvider $imageGen) {}

    /**
     * @return array{prompts: list<array<string, mixed>>, provider: string, stored_previews: int}
     */
    public function handle(ProductionRun $run): array
    {
        $run->loadMissing('artifacts');
        $images = $run->artifacts
            ->where('kind', ArtifactKind::ImagePrompts)
            ->sortByDesc('version')
            ->first();
        $videos = $run->artifacts
            ->where('kind', ArtifactKind::VideoPrompts)
            ->sortByDesc('version')
            ->first();

        $imageList = [];
        if (is_array($images?->payload)) {
            $imageList = $images->payload['image_prompts']
                ?? $images->payload['prompts']
                ?? [];
        }

        $videoList = [];
        if (is_array($videos?->payload)) {
            $videoList = $videos->payload['video_prompts'] ?? [];
        }

        $prompts = [];
        $stored = 0;
        $provider = 'null';

        $disk = (string) config('media.self.disk', 'public');
        $prefix = 'visual-previews/'.$run->id;

        foreach (array_slice(is_array($imageList) ? $imageList : [], 0, 24) as $i => $item) {
            if (! is_array($item)) {
                continue;
            }
            $text = (string) ($item['prompt'] ?? '');
            if ($text === '') {
                continue;
            }

            $result = $this->imageGen->generate($text, [
                'shot_id' => $item['shot_id'] ?? null,
                'kind' => 'image',
            ]);
            $provider = (string) ($result['meta']['provider'] ?? $provider);

            $path = $result['path'] ?? null;
            if (! is_string($path) || $path === '') {
                $rel = $prefix.'/img-'.Str::padLeft((string) $i, 3, '0').'.txt';
                Storage::disk($disk)->put($rel, $text);
                $path = $rel;
            }
            $stored++;

            $prompts[] = [
                'index' => $i,
                'kind' => 'image',
                'shot_id' => $item['shot_id'] ?? null,
                'prompt' => $text,
                'negative_prompt' => $item['negative_prompt'] ?? null,
                'preview_path' => $path,
                'meta' => $result['meta'] ?? [],
            ];
        }

        foreach (array_slice(is_array($videoList) ? $videoList : [], 0, 12) as $i => $item) {
            if (! is_array($item)) {
                continue;
            }
            $text = (string) ($item['prompt'] ?? '');
            if ($text === '') {
                continue;
            }

            $result = $this->imageGen->generate($text, [
                'shot_id' => $item['shot_id'] ?? null,
                'kind' => 'video_motion',
                'motion' => $item['motion'] ?? null,
            ]);
            $provider = (string) ($result['meta']['provider'] ?? $provider);

            $path = $result['path'] ?? null;
            if (! is_string($path) || $path === '') {
                $rel = $prefix.'/vid-'.Str::padLeft((string) $i, 3, '0').'.txt';
                Storage::disk($disk)->put($rel, $text);
                $path = $rel;
            }
            $stored++;

            $prompts[] = [
                'index' => $i,
                'kind' => 'video',
                'shot_id' => $item['shot_id'] ?? null,
                'prompt' => $text,
                'motion' => $item['motion'] ?? null,
                'preview_path' => $path,
                'meta' => $result['meta'] ?? [],
            ];
        }

        return [
            'prompts' => $prompts,
            'provider' => $provider,
            'stored_previews' => $stored,
        ];
    }
}
