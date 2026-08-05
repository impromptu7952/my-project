<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ProductionRunStatus;
use App\Models\ProductionRun;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

final readonly class RejectProductionRun
{
    public function handle(ProductionRun $run, User $editor, ?string $reason = null): ProductionRun
    {
        return DB::transaction(function () use ($run, $editor, $reason): ProductionRun {
            /** @var ProductionRun $run */
            $run = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);

            $allowed = [
                ProductionRunStatus::AwaitingScriptReview,
                ProductionRunStatus::AwaitingFinalReview,
            ];

            if (! in_array($run->status, $allowed, true)) {
                throw new HttpException(422, 'Run cannot be rejected in its current status.');
            }

            $meta = $run->meta ?? [];
            $meta['rejected_by'] = $editor->id;
            $meta['rejected_at'] = now()->toIso8601String();
            if ($reason !== null) {
                $meta['reject_reason'] = $reason;
            }

            $run->update([
                'status' => ProductionRunStatus::Rejected,
                'completed_at' => now(),
                'meta' => $meta,
            ]);

            return $run->fresh() ?? $run;
        });
    }
}
