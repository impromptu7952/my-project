<?php

declare(strict_types=1);

return [
    'videos' => (bool) env('FEATURE_VIDEOS', true),
    'studio' => (bool) env('FEATURE_STUDIO', true),
    'toddler_home' => (bool) env('FEATURE_TODDLER_HOME', true),
];
