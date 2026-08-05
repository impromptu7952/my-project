<?php

declare(strict_types=1);

namespace App\Http\Controllers\Studio;

use App\Actions\Production\UpdateArtifactPayload;
use App\Enums\ArtifactKind;
use App\Http\Controllers\Controller;
use App\Models\ProductionRun;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class UpdateArtifactController extends Controller
{
    public function __construct(private UpdateArtifactPayload $updateArtifact) {}

    public function store(Request $request, ProductionRun $run): RedirectResponse
    {
        $data = $request->validate([
            'kind' => ['required', Rule::enum(ArtifactKind::class)],
            'payload' => ['required', 'array'],
        ]);

        $this->updateArtifact->handle(
            $run,
            ArtifactKind::from($data['kind']),
            $data['payload'],
            $request->user(),
        );

        return redirect()
            ->route('studio.runs.show', $run)
            ->with('success', 'Saved new artifact version.');
    }
}
