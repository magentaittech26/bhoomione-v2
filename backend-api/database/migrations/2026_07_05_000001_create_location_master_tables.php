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
        if (!Schema::hasTable('location_states')) {
            Schema::create('location_states', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('code', 10)->unique();
                $table->string('type', 50)->default('State'); // State or UT
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();

                $table->index('is_active');
            });
        }

        if (!Schema::hasTable('location_districts')) {
            Schema::create('location_districts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('state_id')->constrained('location_states')->onDelete('cascade');
                $table->string('name', 100);
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();
                
                $table->index('state_id');
                $table->index('is_active');
            });
        }

        if (!Schema::hasTable('location_taluks')) {
            Schema::create('location_taluks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('district_id')->constrained('location_districts')->onDelete('cascade');
                $table->string('name', 100);
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();
                
                $table->index('district_id');
                $table->index('is_active');
            });
        }

        if (!Schema::hasTable('location_cities')) {
            Schema::create('location_cities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('district_id')->constrained('location_districts')->onDelete('cascade');
                $table->string('name', 100);
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();
                
                $table->index('district_id');
                $table->index('is_active');
            });
        }

        if (!Schema::hasTable('location_villages')) {
            Schema::create('location_villages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('taluk_id')->constrained('location_taluks')->onDelete('cascade');
                $table->string('name', 100);
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();
                
                $table->index('taluk_id');
                $table->index('is_active');
            });
        }

        if (!Schema::hasTable('location_pincodes')) {
            Schema::create('location_pincodes', function (Blueprint $table) {
                $table->id();
                $table->string('pincode', 20);
                $table->foreignId('city_id')->nullable()->constrained('location_cities')->onDelete('cascade');
                $table->foreignId('village_id')->nullable()->constrained('location_villages')->onDelete('cascade');
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();

                $table->index('pincode');
                $table->index('city_id');
                $table->index('village_id');
                $table->index('is_active');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('location_pincodes');
        Schema::dropIfExists('location_villages');
        Schema::dropIfExists('location_cities');
        Schema::dropIfExists('location_taluks');
        Schema::dropIfExists('location_districts');
        Schema::dropIfExists('location_states');
    }
};
