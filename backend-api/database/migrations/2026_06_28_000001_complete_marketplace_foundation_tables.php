<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add missing columns to developer_profiles
        Schema::table('developer_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('developer_profiles', 'gst')) {
                $table->string('gst', 50)->nullable()->after('rera_number');
            }
            if (!Schema::hasColumn('developer_profiles', 'public_visibility')) {
                $table->boolean('public_visibility')->default(true)->after('rating');
            }
        });

        // Add missing scheduling columns to projects
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'publish_date')) {
                $table->timestamp('publish_date')->nullable();
            }
            if (!Schema::hasColumn('projects', 'unpublish_date')) {
                $table->timestamp('unpublish_date')->nullable();
            }
        });

        // 2. Create marketplace_moderation_history table
        Schema::create('marketplace_moderation_history', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('project_id');
            $table->string('status', 50);
            $table->text('reason');
            $table->string('moderated_by', 255)->default('Central Platform Admin');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // 3. Create marketplace_analytics_cache table
        Schema::create('marketplace_analytics_cache', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id')->unique();
            $table->integer('views_count')->default(0);
            $table->integer('leads_count')->default(0);
            $table->decimal('conversion_rate', 5, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // 4. Create marketplace_view_tracking table
        Schema::create('marketplace_view_tracking', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('project_id');
            $table->string('ip_address', 50)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marketplace_view_tracking');
        Schema::dropIfExists('marketplace_analytics_cache');
        Schema::dropIfExists('marketplace_moderation_history');

        Schema::table('developer_profiles', function (Blueprint $table) {
            $table->dropColumn(['gst', 'public_visibility']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['publish_date', 'unpublish_date']);
        });
    }
};
