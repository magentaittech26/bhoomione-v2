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
        if (!Schema::hasTable('projects')) {
            Schema::create('projects', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('name', 255);
                $table->string('code', 100);
                $table->string('developer_name', 255);
                $table->string('location', 255);
                $table->string('status', 50)->default('PLANNING');
                $table->string('rera_number', 100)->nullable();
                $table->string('approval_status', 100)->nullable();
                $table->string('approval_authority', 255)->nullable();
                $table->date('launch_date')->nullable();
                $table->date('possession_target_date')->nullable();
                $table->jsonb('approvals_metadata')->default(DB::raw("'{}'::jsonb"));
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->unique(['tenant_id', 'code']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
