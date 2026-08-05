<?php

declare(strict_types=1);

namespace App\Enums;

enum MediaProvider: string
{
    case Self = 'self';
    case Youtube = 'youtube';
    case Vimeo = 'vimeo';
}
