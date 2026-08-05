<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CurriculumLinkFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Validation\ValidationException;

final class CurriculumLink extends Model
{
    /** @use HasFactory<CurriculumLinkFactory> */
    use HasFactory;

    protected $fillable = [
        'topic_id',
        'episode_id',
        'game_id',
        'relation',
        'sort_order',
    ];

    /**
     * @return BelongsTo<Topic, $this>
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * @return BelongsTo<Episode, $this>
     */
    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }

    /**
     * @return BelongsTo<Game, $this>
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    protected static function booted(): void
    {
        self::saving(function (CurriculumLink $link): void {
            if ($link->topic_id === null && $link->episode_id === null) {
                throw ValidationException::withMessages([
                    'topic_id' => 'At least one of topic_id or episode_id is required.',
                ]);
            }

            if ($link->episode_id === null) {
                $exists = self::query()
                    ->where('topic_id', $link->topic_id)
                    ->whereNull('episode_id')
                    ->where('game_id', $link->game_id)
                    ->where('relation', $link->relation ?? 'reinforces')
                    ->when($link->exists, fn ($q) => $q->whereKeyNot($link->getKey()))
                    ->exists();

                if ($exists) {
                    throw ValidationException::withMessages([
                        'game_id' => 'A topic-level curriculum link already exists for this game.',
                    ]);
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }
}
