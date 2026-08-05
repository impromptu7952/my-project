<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Models\ProductionRun;
use App\Support\XaiModelCatalog;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Persist preferred text / video models on a production run (meta).
 */
final readonly class UpdateRunModels
{
    /**
     * @param  array{text_model?: string|null, video_model?: string|null}  $models
     */
    public function handle(ProductionRun $run, array $models): ProductionRun
    {
        return DB::transaction(function () use ($run, $models): ProductionRun {
            /** @var ProductionRun $locked */
            $locked = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);
            $meta = $locked->meta ?? [];

            if (array_key_exists('text_model', $models)) {
                $text = $models['text_model'];
                if ($text === null || $text === '') {
                    unset($meta['text_model']);
                } else {
                    if (! XaiModelCatalog::isAllowedTextModel($text)) {
                        throw new HttpException(422, "Unknown text model [{$text}].");
                    }
                    $meta['text_model'] = $text;
                }
            }

            if (array_key_exists('video_model', $models)) {
                $video = $models['video_model'];
                if ($video === null || $video === '') {
                    unset($meta['video_model']);
                } else {
                    if (! XaiModelCatalog::isAllowedVideoModel($video)) {
                        throw new HttpException(422, "Unknown video model [{$video}].");
                    }
                    $meta['video_model'] = $video;
                }
            }

            $locked->update(['meta' => $meta]);

            return $locked->fresh() ?? $locked;
        });
    }
}
