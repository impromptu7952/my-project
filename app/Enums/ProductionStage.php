<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductionStage: string
{
    case Curriculum = 'curriculum';
    case Script = 'script';
    case Storyboard = 'storyboard';
    case VisualPrompts = 'visual_prompts';
    case Voice = 'voice';
    case Editor = 'editor';
    case Quality = 'quality';
}
