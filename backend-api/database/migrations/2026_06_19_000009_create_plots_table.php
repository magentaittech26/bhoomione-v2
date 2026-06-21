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
        if (!Schema::hasTable('plots')) {
            Schema::create('plots', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('layout_id');
                $table->string('plot_number', 100);
                $table->decimal('area_value', 12, 4);
                $table->uuid('measurement_unit_id');
                $table->decimal('length', 10, 2)->nullable();
                $table->decimal('width', 10, 2)->nullable();
                $table->decimal('road_width', 6, 2)->default(0.00);
                $table->boolean('corner_plot')->default(false);
                $table->string('facing', 50)->default('NORTH');
                $table->string('dimensions', 100);
                $table->jsonb('dimensions_metadata')->default(DB::raw("'{}'::jsonb"));
                $table->string('status', 50)->default('AVAILABLE');
                $table->timestamps();

                $table->foreign('layout_id')->references('id')->on('layouts')->onDelete('cascade');
                $table->foreign('measurement_unit_id')->references('id')->on('measurement_units')->onDelete('restrict');
                $table->unique(['layout_id', 'plot_number']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plots');
    }
};
