<?php

declare(strict_types=1);

return [
    'videos' => (bool) env('FEATURE_VIDEOS', true),
    // Default false per design — enable explicitly for local/studio pilot.
    'studio' => (bool) env('FEATURE_STUDIO', false),
    'toddler_home' => (bool) env('FEATURE_TODDLER_HOME', true),
];
