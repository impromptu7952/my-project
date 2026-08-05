<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_profiles', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('stage'); // ProductionStage value
            $table->text('description')->nullable();
            $table->text('system_prompt');
            $table->string('model')->default('grok-4.5');
            $table->unsignedInteger('max_tokens')->default(3000);
            $table->decimal('temperature', 3, 2)->default(0.40);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('meta')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['stage', 'is_default']);
        });

        // Per-run overrides: stage => agent_profile_id
        Schema::table('production_runs', function (Blueprint $table): void {
            $table->json('agent_profile_map')->nullable()->after('meta');
        });
    }

    public function down(): void
    {
        Schema::table('production_runs', function (Blueprint $table): void {
            $table->dropColumn('agent_profile_map');
        });

        Schema::dropIfExists('agent_profiles');
    }
};
