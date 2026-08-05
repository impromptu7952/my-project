<?php

declare(strict_types=1);

namespace App\Enums;

enum ProductionRunStatus: string
{
    case RunningChainA = 'running_chain_a';
    case AwaitingScriptReview = 'awaiting_script_review';
    case RunningChainB = 'running_chain_b';
    case AwaitingFinalReview = 'awaiting_final_review';
    case Approved = 'approved';
    case Published = 'published';
    case Rejected = 'rejected';
    case Failed = 'failed';

    /**
     * @return list<self>
     */
    public static function openStatuses(): array
    {
        return [
            self::RunningChainA,
            self::AwaitingScriptReview,
            self::RunningChainB,
            self::AwaitingFinalReview,
        ];
    }

    public function isOpen(): bool
    {
        return in_array($this, self::openStatuses(), true);
    }
}
