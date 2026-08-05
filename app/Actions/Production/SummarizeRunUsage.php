<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Models\ProductionArtifact;
use App\Models\ProductionRun;

/**
 * Aggregate xAI usage metadata recorded on artifacts.
 *
 * @return array{artifact_count: int, versions: int, prompt_tokens: int, completion_tokens: int, total_tokens: int, xai_calls: int}
 */
final readonly class SummarizeRunUsage
{
    /**
     * @return array{artifact_count: int, versions: int, prompt_tokens: int, completion_tokens: int, total_tokens: int, xai_calls: int}
     */
    public function handle(ProductionRun $run): array
    {
        $artifacts = $run->relationLoaded('artifacts')
            ? $run->artifacts
            : $run->artifacts()->get();

        $prompt = 0;
        $completion = 0;
        $total = 0;
        $xaiCalls = 0;

        foreach ($artifacts as $artifact) {
            /** @var ProductionArtifact $artifact */
            $usage = $artifact->meta['usage'] ?? null;
            if (! is_array($usage)) {
                continue;
            }

            $xaiCalls++;
            $prompt += (int) ($usage['prompt_tokens'] ?? $usage['input_tokens'] ?? 0);
            $completion += (int) ($usage['completion_tokens'] ?? $usage['output_tokens'] ?? 0);
            $total += (int) ($usage['total_tokens'] ?? 0);
        }

        if ($total === 0) {
            $total = $prompt + $completion;
        }

        return [
            'artifact_count' => $artifacts->unique('kind')->count(),
            'versions' => $artifacts->count(),
            'prompt_tokens' => $prompt,
            'completion_tokens' => $completion,
            'total_tokens' => $total,
            'xai_calls' => $xaiCalls,
        ];
    }
}
