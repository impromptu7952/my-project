<?php

declare(strict_types=1);

namespace App\Actions\Production;

use Illuminate\Validation\ValidationException;

final readonly class ValidateProductionSpec
{
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

        if (($spec['language'] ?? null) !== 'sq') {
            throw ValidationException::withMessages([
                'spec.language' => 'Pilot specs must use language "sq" (standard literary Albanian).',
            ]);
        }

        if (! is_array($spec['learning_goals']) || $spec['learning_goals'] === []) {
            throw ValidationException::withMessages([
                'spec.learning_goals' => 'learning_goals must be a non-empty array.',
            ]);
        }

        if (! is_array($spec['vocabulary']) || $spec['vocabulary'] === []) {
            throw ValidationException::withMessages([
                'spec.vocabulary' => 'vocabulary must be a non-empty array.',
            ]);
        }

        if (! is_array($spec['structure']) || $spec['structure'] === []) {
            throw ValidationException::withMessages([
                'spec.structure' => 'structure must be a non-empty array.',
            ]);
        }

        return $spec;
    }
}
