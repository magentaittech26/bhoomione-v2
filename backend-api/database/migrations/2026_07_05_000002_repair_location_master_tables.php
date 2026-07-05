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
        // 1. Repair location_states
        if (Schema::hasTable('location_states')) {
            Schema::table('location_states', function (Blueprint $table) {
                if (!Schema::hasColumn('location_states', 'type')) {
                    $table->string('type', 50)->default('State');
                }
                if (!Schema::hasColumn('location_states', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_states', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_states', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('location_states', 'source_ref')) {
                    $table->string('source_ref', 100)->nullable();
                }
                if (!Schema::hasColumn('location_states', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('location_states', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        // 2. Repair location_districts
        if (Schema::hasTable('location_districts')) {
            Schema::table('location_districts', function (Blueprint $table) {
                if (!Schema::hasColumn('location_districts', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_districts', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_districts', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('location_districts', 'source_ref')) {
                    $table->string('source_ref', 100)->nullable();
                }
                if (!Schema::hasColumn('location_districts', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('location_districts', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        // 3. Repair location_taluks
        if (Schema::hasTable('location_taluks')) {
            Schema::table('location_taluks', function (Blueprint $table) {
                if (!Schema::hasColumn('location_taluks', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_taluks', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_taluks', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('location_taluks', 'source_ref')) {
                    $table->string('source_ref', 100)->nullable();
                }
                if (!Schema::hasColumn('location_taluks', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('location_taluks', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        // 4. Repair location_cities
        if (Schema::hasTable('location_cities')) {
            Schema::table('location_cities', function (Blueprint $table) {
                if (!Schema::hasColumn('location_cities', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_cities', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_cities', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('location_cities', 'source_ref')) {
                    $table->string('source_ref', 100)->nullable();
                }
                if (!Schema::hasColumn('location_cities', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('location_cities', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        // 5. Repair location_villages
        if (Schema::hasTable('location_villages')) {
            Schema::table('location_villages', function (Blueprint $table) {
                if (!Schema::hasColumn('location_villages', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_villages', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_villages', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('location_villages', 'source_ref')) {
                    $table->string('source_ref', 100)->nullable();
                }
                if (!Schema::hasColumn('location_villages', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('location_villages', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        // 6. Repair location_pincodes
        if (Schema::hasTable('location_pincodes')) {
            Schema::table('location_pincodes', function (Blueprint $table) {
                if (!Schema::hasColumn('location_pincodes', 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_pincodes', 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn('location_pincodes', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
                if (!Schema::hasColumn('location_pincodes', 'source_ref')) {
                    $table->string('source_ref', 100)->nullable();
                }
                if (!Schema::hasColumn('location_pincodes', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('location_pincodes', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down needed for repair migration to avoid accidental data loss
    }
};
