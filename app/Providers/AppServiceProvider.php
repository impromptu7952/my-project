<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\ImageGenProvider;
use App\Contracts\TtsProvider;
use App\Contracts\VideoGenProvider;
use App\Models\User;
use App\Services\ImageGen\NullImageGenProvider;
use App\Services\Tts\NullTtsProvider;
use App\Services\VideoGen\NullVideoGenProvider;
use App\Services\VideoGen\XaiImagineVideoProvider;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Override;

final class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    #[Override]
    public function register(): void
    {
        $this->app->bind(TtsProvider::class, function (): TtsProvider {
            // Real Albanian TTS drivers plug in here when TTS_DRIVER is set.
            return match ((string) config('services.tts.driver', 'null')) {
                default => new NullTtsProvider,
            };
        });
        $this->app->bind(ImageGenProvider::class, NullImageGenProvider::class);
        $this->app->bind(VideoGenProvider::class, function (): VideoGenProvider {
            if (filled(config('services.xai.api_key'))) {
                return new XaiImagineVideoProvider;
            }

            return new NullVideoGenProvider;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::define('manage-content', fn (User $user): bool => (bool) $user->is_editor);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    private function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
