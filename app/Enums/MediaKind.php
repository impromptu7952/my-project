<?php

declare(strict_types=1);

namespace App\Enums;

enum MediaKind: string
{
    case VideoMaster = 'video_master';
    case Subtitle = 'subtitle';
    case Thumbnail = 'thumbnail';
    case Audio = 'audio';
}
