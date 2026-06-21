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
        if (!Schema::hasTable('generation_batches')) {
            Schema::create('generation_batches', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->uuid('import_job_id');
                $table->jsonb('generated_plots')->default(DB::raw("'[]'::jsonb"));
                $table->jsonb('generated_roads')->default(DB::raw("'[]'::jsonb"));
                $table->jsonb('generated_amenities')->default(DB::raw("'[]'::jsonb"));
                $table->string('status', 50)->default('PENDING'); // PENDING, APPROVED, FAILED
                $table->uuid('created_by')->nullable();
                $table->uuid('approved_by')->nullable();
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->foreign('import_job_id')->references('id')->on('import_jobs')->onDelete('cascade');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
                $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

                $table->index('tenant_id');
                $table->index('import_job_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generation_batches');
    }
};
