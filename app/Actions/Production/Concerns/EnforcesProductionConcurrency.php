<?php

declare(strict_types=1);

namespace App\Actions\Production\Concerns;

use App\Enums\ProductionRunStatus;
use App\Models\ProductionRun;
use App\Models\ProductionSpec;
use Symfony\Component\HttpKernel\Exception\HttpException;

trait EnforcesProductionConcurrency
{
    /**
     * @return list<string>
     */
    protected function openStatusValues(): array
    {
        return array_map(
            fn (ProductionRunStatus $s): string => $s->value,
            ProductionRunStatus::openStatuses()
        );
    }

    protected function assertGlobalOpenCapacity(?int $exceptRunId = null): void
    {
        $query = ProductionRun::query()
            ->whereIn('status', $this->openStatusValues())
            ->lockForUpdate();

        if ($exceptRunId !== null) {
            $query->whereKeyNot($exceptRunId);
        }

        if ($query->count() >= 3) {
            throw new HttpException(503, 'Global production run limit reached (max 3 open).');
        }
    }

    protected function assertNoOpenRunOnSpec(ProductionSpec $spec, ?int $exceptRunId = null): void
    {
        $query = ProductionRun::query()
            ->where('production_spec_id', $spec->id)
            ->whereIn('status', $this->openStatusValues())
            ->lockForUpdate();

        if ($exceptRunId !== null) {
            $query->whereKeyNot($exceptRunId);
        }

        if ($query->exists()) {
            throw new HttpException(422, 'This production spec already has an open run.');
        }
    }
}
