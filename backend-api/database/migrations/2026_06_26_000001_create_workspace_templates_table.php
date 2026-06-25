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
        // 1. Create workspace_templates table
        if (!Schema::hasTable('workspace_templates')) {
            Schema::create('workspace_templates', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('code', 100)->unique();
                $table->string('name', 255);
                $table->text('description')->nullable();
                $table->jsonb('roles_permissions')->default(DB::raw("'{}'::jsonb"));
                $table->jsonb('menus')->default(DB::raw("'{}'::jsonb"));
                $table->jsonb('modules')->default(DB::raw("'[]'::jsonb"));
                $table->jsonb('features')->default(DB::raw("'{}'::jsonb"));
                $table->jsonb('limits')->default(DB::raw("'{}'::jsonb"));
                $table->jsonb('default_settings')->default(DB::raw("'{}'::jsonb"));
                $table->jsonb('branding')->default(DB::raw("'{}'::jsonb"));
                $table->jsonb('seed_data')->default(DB::raw("'{}'::jsonb"));
                $table->timestamps();
            });
        }

        // 2. Add progress columns to tenant_provisioning_jobs table
        Schema::table('tenant_provisioning_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('tenant_provisioning_jobs', 'current_step')) {
                $table->string('current_step', 100)->default('Pending')->nullable();
            }
            if (!Schema::hasColumn('tenant_provisioning_jobs', 'progress_percent')) {
                $table->integer('progress_percent')->default(0);
            }
            if (!Schema::hasColumn('tenant_provisioning_jobs', 'duration_seconds')) {
                $table->integer('duration_seconds')->default(0);
            }
            if (!Schema::hasColumn('tenant_provisioning_jobs', 'retry_count')) {
                $table->integer('retry_count')->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_provisioning_jobs', function (Blueprint $table) {
            $table->dropColumn(['current_step', 'progress_percent', 'duration_seconds', 'retry_count']);
        });

        Schema::dropIfExists('workspace_templates');
    }
};
