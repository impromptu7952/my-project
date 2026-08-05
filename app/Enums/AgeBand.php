<?php

declare(strict_types=1);

namespace App\Enums;

enum AgeBand: string
{
    case OneToTwo = '1-2';
    case TwoToThree = '2-3';
    case OneToThree = '1-3';
    case ThreeToFive = '3-5';
    case FivePlus = '5+';
}
