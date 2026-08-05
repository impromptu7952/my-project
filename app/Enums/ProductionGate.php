<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductionGate: string
{
    case Script = 'script';
    case Final = 'final';
}
