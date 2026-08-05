<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topics', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name_sq');
            $table->string('name_en')->nullable();
            $table->text('description_sq')->nullable();
            $table->text('description_en')->nullable();
            $table->string('age_band')->default('1-3');
            $table->json('skills')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('series', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('title_sq');
            $table->string('title_en')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('episodes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('series_id')->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('title_sq');
            $table->string('title_en')->nullable();
            $table->string('language', 8)->default('sq');
            $table->string('age_band')->default('1-3');
            $table->string('status')->default('draft');
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('episode_number')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('summary_sq')->nullable();
            $table->text('summary_en')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->json('skills')->nullable();
            $table->timestamps();
        });

        Schema::create('media_assets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('episode_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->string('provider')->default('self');
            $table->string('disk')->nullable();
            $table->string('path')->nullable();
            $table->string('external_id')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['episode_id', 'kind']);
        });

        Schema::create('games', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('route_name');
            $table->string('name_sq');
            $table->string('name_en');
            $table->text('description_sq')->nullable();
            $table->text('description_en')->nullable();
            $table->string('age_band')->default('3-5');
            $table->string('emoji', 16)->default('🎮');
            $table->string('badge_sq')->nullable();
            $table->string('badge_en')->nullable();
            $table->string('gradient')->nullable();
            $table->boolean('featured_for_toddlers')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('curriculum_links', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('episode_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('relation')->default('reinforces');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['episode_id', 'game_id', 'relation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curriculum_links');
        Schema::dropIfExists('games');
        Schema::dropIfExists('media_assets');
        Schema::dropIfExists('episodes');
        Schema::dropIfExists('series');
        Schema::dropIfExists('topics');
    }
};
