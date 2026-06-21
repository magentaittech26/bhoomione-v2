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
        if (!Schema::hasTable('geometry_entities')) {
            Schema::create('geometry_entities', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('import_job_id');
                $table->uuid('source_layer_mapping_id');
                $table->string('layer_name', 150);
                $table->string('geometry_type', 50);
                $table->boolean('is_closed')->default(false);
                $table->integer('vertex_count')->default(0);
                $table->jsonb('vertices_json');
                $table->double('area_value')->default(0.0);
                $table->jsonb('bounding_box');
                $table->string('source_unit', 50)->default('METERS');
                $table->string('normalized_unit', 50)->default('METERS');
                $table->string('geometry_hash', 64);
                $table->string('validation_status', 50)->default('VALID');
                $table->jsonb('validation_messages')->default(DB::raw("'[]'::jsonb"));
                $table->timestamps();

                $table->foreign('import_job_id')->references('id')->on('import_jobs')->onDelete('cascade');
                $table->foreign('source_layer_mapping_id')->references('id')->on('dxf_layer_mappings')->onDelete('restrict');
                
                $table->index('import_job_id');
                $table->index('source_layer_mapping_id');
                $table->index('geometry_hash');
                $table->index('layer_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('geometry_entities');
    }
};
