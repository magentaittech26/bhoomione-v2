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
        // 1. Create dxf_files table
        if (!Schema::hasTable('dxf_files')) {
            Schema::create('dxf_files', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->uuid('project_id');
                $table->uuid('layout_id')->nullable();
                $table->string('file_name', 255);
                $table->string('file_path', 512);
                $table->bigInteger('file_size');
                $table->string('file_hash', 64);
                $table->integer('version')->default(1);
                $table->uuid('created_by')->nullable();
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            });
        }

        // 2. Create import_jobs table
        if (!Schema::hasTable('import_jobs')) {
            Schema::create('import_jobs', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->uuid('dxf_file_id');
                $table->string('status', 40)->default('uploaded');
                $table->integer('total_entities_found')->nullable();
                $table->jsonb('extracted_metadata')->default(DB::raw("'{}'::jsonb"));
                $table->text('error_message')->nullable();
                $table->timestamp('queued_at')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->foreign('dxf_file_id')->references('id')->on('dxf_files')->onDelete('cascade');
            });
        }

        // 3. Create import_job_logs table
        if (!Schema::hasTable('import_job_logs')) {
            Schema::create('import_job_logs', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('import_job_id');
                $table->string('log_level', 20)->default('INFO');
                $table->string('step_name', 80);
                $table->text('message');
                $table->integer('duration_ms')->nullable();
                $table->timestamps();

                $table->foreign('import_job_id')->references('id')->on('import_jobs')->onDelete('cascade');
            });
        }

        // 4. Create dxf_layer_mappings table
        if (!Schema::hasTable('dxf_layer_mappings')) {
            Schema::create('dxf_layer_mappings', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->uuid('dxf_file_id');
                $table->string('layer_name', 150);
                $table->string('layer_type', 40); // PLOT, ROAD, AMENITY, UTILITY, BOUNDARY, IGNORE
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->foreign('dxf_file_id')->references('id')->on('dxf_files')->onDelete('cascade');
                $table->unique(['dxf_file_id', 'layer_name']);
            });
        }

        // 5. Create import_templates table
        if (!Schema::hasTable('import_templates')) {
            Schema::create('import_templates', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('name', 150);
                $table->jsonb('mappings')->default(DB::raw("'{}'::jsonb"));
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('import_templates');
        Schema::dropIfExists('dxf_layer_mappings');
        Schema::dropIfExists('import_job_logs');
        Schema::dropIfExists('import_jobs');
        Schema::dropIfExists('dxf_files');
    }
};
