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
        if (!Schema::hasTable('roads')) {
            Schema::create('roads', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('layout_id');
                $table->uuid('source_geometry_entity_id')->nullable();
                $table->uuid('generation_batch_id')->nullable();
                $table->string('road_name', 100);
                $table->string('road_type', 50)->default('INTERNAL_ROAD'); // MAIN_ROAD, INTERNAL_ROAD, ACCESS_ROAD
                $table->decimal('width', 10, 2)->default(0.00);
                $table->decimal('length', 10, 2)->default(0.00);
                $table->decimal('area_value', 12, 4)->default(0.00);
                $table->uuid('measurement_unit_id');
                $table->jsonb('bounding_box');
                $table->timestamps();

                $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('cascade');
                $table->foreign('source_geometry_entity_id')->references('id')->on('geometry_entities')->onDelete('set null');
                $table->foreign('generation_batch_id')->references('id')->on('generation_batches')->onDelete('set null');
                $table->foreign('measurement_unit_id')->references('id')->on('measurement_units')->onDelete('restrict');

                $table->index('layout_id');
                $table->index('source_geometry_entity_id');
                $table->index('generation_batch_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roads');
    }
};
