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
                if (!Schema::hasColumn('plots', 'source_geometry_entity_id')) {
                    $table->uuid('source_geometry_entity_id')->nullable();
                    $table->foreign('source_geometry_entity_id')->references('id')->on('geometry_entities')->onDelete('set null');
                }
                if (!Schema::hasColumn('plots', 'generation_batch_id')) {
                    $table->uuid('generation_batch_id')->nullable();
                    $table->foreign('generation_batch_id')->references('id')->on('generation_batches')->onDelete('set null');
                }
                if (!Schema::hasColumn('plots', 'detected_label')) {
                    $table->string('detected_label', 100)->nullable();
                }
                if (!Schema::hasColumn('plots', 'generated_label')) {
                    $table->string('generated_label', 100)->nullable();
                }

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
        if (Schema::hasTable('plots')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropForeign(['source_geometry_entity_id']);
                $table->dropForeign(['generation_batch_id']);
                $table->dropColumn(['source_geometry_entity_id', 'generation_batch_id', 'detected_label', 'generated_label']);
            });
        }
    }
};
