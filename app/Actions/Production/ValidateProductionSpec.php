<?php

declare(strict_types=1);

namespace App\Actions\Production;

use Illuminate\Validation\ValidationException;

final readonly class ValidateProductionSpec
{
    private const ALLOWED_AGE_BANDS = ['1-2', '2-3', '1-3'];

    /**
     * @param  array<string, mixed>  $spec
     * @return array<string, mixed>
     */
    public function handle(array $spec): array
    {
        $required = ['version', 'language', 'age_band', 'episode_slug', 'learning_goals', 'vocabulary', 'structure'];

        foreach ($required as $key) {
            if (! array_key_exists($key, $spec)) {
                throw ValidationException::withMessages([
                    'spec' => "Missing required key: {$key}",
                ]);
            }
        }

        if (($spec['version'] ?? null) !== '1' && ($spec['version'] ?? null) !== 1) {
            throw ValidationException::withMessages([
                'spec.version' => 'spec.version must be "1".',
            ]);
        }

        // Normalize version to string for storage consistency with schema.
        $spec['version'] = '1';

        if (($spec['language'] ?? null) !== 'sq') {
            throw ValidationException::withMessages([
                'spec.language' => 'Pilot specs must use language "sq" (standard literary Albanian).',
            ]);
        }

        if (! is_string($spec['age_band']) || ! in_array($spec['age_band'], self::ALLOWED_AGE_BANDS, true)) {
            throw ValidationException::withMessages([
                'spec.age_band' => 'age_band must be one of: '.implode(', ', self::ALLOWED_AGE_BANDS),
            ]);
        }

        if (! is_string($spec['episode_slug']) || $spec['episode_slug'] === '') {
            throw ValidationException::withMessages([
                'spec.episode_slug' => 'episode_slug must be a non-empty string.',
            ]);
        }

        if (! is_array($spec['learning_goals']) || $spec['learning_goals'] === []) {
            throw ValidationException::withMessages([
                'spec.learning_goals' => 'learning_goals must be a non-empty array.',
            ]);
        }

        foreach ($spec['learning_goals'] as $i => $goal) {
            if (! is_string($goal) || $goal === '') {
                throw ValidationException::withMessages([
                    "spec.learning_goals.{$i}" => 'Each learning goal must be a non-empty string.',
                ]);
            }
        }

        if (! is_array($spec['vocabulary']) || $spec['vocabulary'] === []) {
            throw ValidationException::withMessages([
                'spec.vocabulary' => 'vocabulary must be a non-empty array.',
            ]);
        }

        foreach ($spec['vocabulary'] as $i => $item) {
            if (! is_array($item) || ! isset($item['word']) || ! is_string($item['word']) || $item['word'] === '') {
                throw ValidationException::withMessages([
                    "spec.vocabulary.{$i}" => 'Each vocabulary item must include a non-empty "word" string.',
                ]);
            }
        }

        if (! is_array($spec['structure']) || $spec['structure'] === []) {
            throw ValidationException::withMessages([
                'spec.structure' => 'structure must be a non-empty array.',
            ]);
        }

        foreach ($spec['structure'] as $i => $block) {
            if (! is_array($block) || ! isset($block['block']) || ! is_string($block['block']) || $block['block'] === '') {
                throw ValidationException::withMessages([
                    "spec.structure.{$i}" => 'Each structure item must include a non-empty "block" string.',
                ]);
            }
        }

        if (isset($spec['principles']) && ! is_array($spec['principles'])) {
            throw ValidationException::withMessages([
                'spec.principles' => 'principles must be an object/array when provided.',
            ]);
        }

        if (isset($spec['principles']['pause_seconds'])) {
            $pause = $spec['principles']['pause_seconds'];
            if (! is_int($pause) && ! (is_numeric($pause) && (int) $pause === $pause)) {
                throw ValidationException::withMessages([
                    'spec.principles.pause_seconds' => 'pause_seconds must be an integer.',
                ]);
            }
            $pause = (int) $pause;
            if ($pause < 1 || $pause > 10) {
                throw ValidationException::withMessages([
                    'spec.principles.pause_seconds' => 'pause_seconds must be between 1 and 10.',
                ]);
            }
            $spec['principles']['pause_seconds'] = $pause;
        }

        return $spec;
    }
}
