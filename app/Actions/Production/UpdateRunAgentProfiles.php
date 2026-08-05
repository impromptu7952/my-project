<?php

declare(strict_types=1);

namespace App\Actions\Production;

use App\Enums\ProductionStage;
use App\Models\AgentProfile;
use App\Models\ProductionRun;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * @param  array<string, int|null>  $map  stage value => agent_profile_id
 */
final readonly class UpdateRunAgentProfiles
{
    /**
     * @param  array<string, int|null>  $map
     */
    public function handle(ProductionRun $run, array $map): ProductionRun
    {
        $clean = [];

        foreach ($map as $stage => $profileId) {
            if (! is_string($stage) || ProductionStage::tryFrom($stage) === null) {
                throw new HttpException(422, "Invalid stage: {$stage}");
            }

            if ($profileId === null || $profileId === 0) {
                continue;
            }

            $exists = AgentProfile::query()
                ->active()
                ->whereKey($profileId)
                ->where('stage', $stage)
                ->exists();

            if (! $exists) {
                throw new HttpException(422, "Agent profile {$profileId} is not valid for stage {$stage}.");
            }

            $clean[$stage] = (int) $profileId;
        }

        return DB::transaction(function () use ($run, $clean): ProductionRun {
            /** @var ProductionRun $locked */
            $locked = ProductionRun::query()->lockForUpdate()->findOrFail($run->id);
            $locked->update(['agent_profile_map' => $clean]);

            return $locked->fresh() ?? $locked;
        });
    }
}
