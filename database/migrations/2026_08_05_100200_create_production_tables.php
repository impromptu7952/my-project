<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_specs', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('episode_slug')->nullable();
            $table->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('episode_id')->nullable()->constrained()->nullOnDelete();
            $table->json('spec');
            $table->string('version')->default('1');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('production_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('production_spec_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->string('current_stage')->nullable();
            $table->text('error')->nullable();
            $table->json('meta')->nullable();
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->foreignId('script_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('script_approved_at')->nullable();
            $table->foreignId('final_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('final_approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('production_artifacts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('production_run_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->string('stage')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->json('payload');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['production_run_id', 'kind', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_artifacts');
        Schema::dropIfExists('production_runs');
        Schema::dropIfExists('production_specs');
    }
};
