<?php

declare(strict_types=1);

namespace App\Enums;

enum ArtifactKind: string
{
    case Curriculum = 'curriculum';
    case Script = 'script';
    case Storyboard = 'storyboard';
    case ShotList = 'shot_list';
    case ImagePrompts = 'image_prompts';
    case VideoPrompts = 'video_prompts';
    case ThumbnailConcept = 'thumbnail_concept';
    case VoScript = 'vo_script';
    case TtsManifest = 'tts_manifest';
    case EditInstructions = 'edit_instructions';
    case OnScreenText = 'on_screen_text';
    case SubtitlesVtt = 'subtitles_vtt';
    case QualityReport = 'quality_report';
    case VisualApproval = 'visual_approval';
}
