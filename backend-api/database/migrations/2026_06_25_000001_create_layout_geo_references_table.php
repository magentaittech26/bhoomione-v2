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
        if (!Schema::hasTable('layout_geo_references')) {
            Schema::create('layout_geo_references', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id')->nullable()->index();
                $table->uuid('layout_id')->unique()->index();

                $table->decimal('anchor_1_dxf_x', 24, 10);
                $table->decimal('anchor_1_dxf_y', 24, 10);
                $table->decimal('anchor_1_lat', 10, 7);
                $table->decimal('anchor_1_lng', 10, 7);

                $table->decimal('anchor_2_dxf_x', 24, 10);
                $table->decimal('anchor_2_dxf_y', 24, 10);
                $table->decimal('anchor_2_lat', 10, 7);
                $table->decimal('anchor_2_lng', 10, 7);

                $table->jsonb('transform_matrix')->nullable();

                $table->timestamps();

                $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('layout_geo_references');
    }
};
