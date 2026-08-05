<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ArtifactKind;
use App\Models\ProductionRun;

final readonly class RunDeterministicQualityChecks
{
    /**
     * @return array{passed: bool, checks: list<array{name: string, passed: bool, detail: string}>}
     */
    public function handle(ProductionRun $run): array
    {
        $run->load('artifacts', 'productionSpec');
        $checks = [];

        $script = $run->artifacts->firstWhere('kind', ArtifactKind::Script);
        $checks[] = [
            'name' => 'script_present',
            'passed' => $script !== null,
            'detail' => $script ? 'Script artifact found' : 'Missing script artifact',
        ];

        $forbidden = ['http://', 'https://', 'kill', 'blood', 'weapon'];
        $scriptText = is_array($script?->payload) ? json_encode($script->payload) : '';
        $hasForbidden = false;
        foreach ($forbidden as $phrase) {
            if ($scriptText !== false && str_contains(mb_strtolower((string) $scriptText), $phrase)) {
                $hasForbidden = true;
                break;
            }
        }
        $checks[] = [
            'name' => 'forbidden_phrases',
            'passed' => ! $hasForbidden,
            'detail' => $hasForbidden ? 'Forbidden phrase detected' : 'No forbidden phrases',
        ];

        $vocab = $run->productionSpec?->spec['vocabulary'] ?? [];
        $checks[] = [
            'name' => 'vocabulary_defined',
            'passed' => is_array($vocab) && count($vocab) > 0,
            'detail' => is_array($vocab) ? count($vocab).' vocabulary items' : 'No vocabulary',
        ];

        $sections = is_array($script?->payload)
            ? ($script->payload['sections'] ?? [])
            : [];
        $longLines = 0;
        $pauseOk = 0;
        $pauseTotal = 0;
        if (is_array($sections)) {
            foreach ($sections as $section) {
                if (! is_array($section)) {
                    continue;
                }
                foreach ($section['dialogue'] ?? [] as $line) {
                    if (! is_string($line)) {
                        continue;
                    }
                    $words = count(preg_split('/\s+/u', mb_trim($line)) ?: []);
                    if ($words > 8) {
                        $longLines++;
                    }
                }
                if (isset($section['pause_seconds']) && is_numeric($section['pause_seconds'])) {
                    $pauseTotal++;
                    $pause = (float) $section['pause_seconds'];
                    if ($pause >= 2 && $pause <= 8) {
                        $pauseOk++;
                    }
                }
            }
        }

        $checks[] = [
            'name' => 'short_dialogue_lines',
            'passed' => $longLines === 0,
            'detail' => $longLines === 0
                ? 'All dialogue lines ≤ 8 words'
                : "{$longLines} dialogue line(s) exceed 8 words",
        ];

        $checks[] = [
            'name' => 'pause_windows',
            'passed' => $pauseTotal === 0 || $pauseOk === $pauseTotal,
            'detail' => $pauseTotal === 0
                ? 'No explicit pauses (optional)'
                : "{$pauseOk}/{$pauseTotal} pauses in 2–8s toddler range",
        ];

        $vo = $run->artifacts->firstWhere('kind', ArtifactKind::VoScript);
        $checks[] = [
            'name' => 'vo_script_present',
            'passed' => $vo !== null,
            'detail' => $vo ? 'VO script artifact found' : 'Missing VO script artifact',
        ];

        $passed = collect($checks)->every(fn (array $c): bool => $c['passed']);

        return [
            'passed' => $passed,
            'checks' => $checks,
        ];
    }
}
