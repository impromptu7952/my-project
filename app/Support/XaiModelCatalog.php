<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Catalog of xAI text + Imagine video models exposed to the Studio UI.
 */
final class XaiModelCatalog
{
    /**
     * @return list<array{id: string, label: string, hint: string}>
     */
    public static function textModels(): array
    {
        $raw = config('services.xai.text_models', []);
        if (! is_array($raw)) {
            return [];
        }

        $models = [];
        foreach ($raw as $row) {
            if (! is_array($row) || ! filled($row['id'] ?? null)) {
                continue;
            }
            $models[] = [
                'id' => (string) $row['id'],
                'label' => (string) ($row['label'] ?? $row['id']),
                'hint' => (string) ($row['hint'] ?? ''),
            ];
        }

        return $models;
    }

    /**
     * @return list<array{id: string, label: string, hint: string, usd_per_sec: float}>
     */
    public static function videoModels(): array
    {
        $raw = config('services.xai.video_models', []);
        if (! is_array($raw)) {
            return [];
        }

        $rates = (array) config('services.xai.video_usd_per_sec', []);
        $models = [];
        foreach ($raw as $row) {
            if (! is_array($row) || ! filled($row['id'] ?? null)) {
                continue;
            }
            $id = (string) $row['id'];
            $models[] = [
                'id' => $id,
                'label' => (string) ($row['label'] ?? $id),
                'hint' => (string) ($row['hint'] ?? ''),
                'usd_per_sec' => (float) ($row['usd_per_sec'] ?? $rates[$id] ?? 0.05),
            ];
        }

        return $models;
    }

    /**
     * @return list<string>
     */
    public static function textModelIds(): array
    {
        return array_column(self::textModels(), 'id');
    }

    /**
     * @return list<string>
     */
    public static function videoModelIds(): array
    {
        return array_column(self::videoModels(), 'id');
    }

    public static function isAllowedTextModel(string $model): bool
    {
        return in_array($model, self::textModelIds(), true);
    }

    public static function isAllowedVideoModel(string $model): bool
    {
        return in_array($model, self::videoModelIds(), true);
    }

    public static function defaultTextModel(): string
    {
        return (string) config('services.xai.model', 'grok-4.5');
    }

    public static function defaultVideoModel(): string
    {
        return (string) config('services.xai.video_model', 'grok-imagine-video');
    }

    public static function usdPerSecFor(string $videoModel): float
    {
        $rates = (array) config('services.xai.video_usd_per_sec', []);

        return (float) ($rates[$videoModel] ?? 0.05);
    }
}
