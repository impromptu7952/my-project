<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

final class PromoteEditorCommand extends Command
{
    protected $signature = 'app:promote-editor {email}';

    protected $description = 'Promote a user to content editor (is_editor=true)';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            $this->error("User not found: {$email}");

            return self::FAILURE;
        }

        $user->forceFill(['is_editor' => true])->save();
        $this->info("Promoted {$email} to editor.");

        return self::SUCCESS;
    }
}
