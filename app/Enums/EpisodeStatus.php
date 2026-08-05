<?php

declare(strict_types=1);

namespace App\Enums;

enum EpisodeStatus: string
{
    case Draft = 'draft';
    case InReview = 'in_review';
    case Published = 'published';
    case Archived = 'archived';
}
