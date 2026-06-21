<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('plots')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->unique('source_geometry_entity_id', 'plots_source_geometry_entity_id_unique');
            });
        }

        if (Schema::hasTable('roads')) {
            Schema::table('roads', function (Blueprint $table) {
                $table->unique('source_geometry_entity_id', 'roads_source_geometry_entity_id_unique');
            });
        }

        if (Schema::hasTable('amenities')) {
            Schema::table('amenities', function (Blueprint $table) {
                $table->unique('source_geometry_entity_id', 'amenities_source_geometry_entity_id_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('plots')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropUnique('plots_source_geometry_entity_id_unique');
            });
        }

        if (Schema::hasTable('roads')) {
            Schema::table('roads', function (Blueprint $table) {
                $table->dropUnique('roads_source_geometry_entity_id_unique');
            });
        }

        if (Schema::hasTable('amenities')) {
            Schema::table('amenities', function (Blueprint $table) {
                $table->dropUnique('amenities_source_geometry_entity_id_unique');
            });
        }
    }
};
