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
        if (!Schema::hasTable('location_pincodes')) {
            Schema::create('location_pincodes', function (Blueprint $table) {
                $table->id();
                $table->string('pincode', 10);
                
                // Foreign keys with nullOnDelete compatibility
                $table->unsignedBigInteger('city_id')->nullable();
                $table->unsignedBigInteger('village_id')->nullable();
                
                $table->decimal('latitude', 10, 7)->nullable();
                $table->decimal('longitude', 10, 7)->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('source_ref', 100)->nullable();
                $table->timestamps();

                // Foreign key constraint setups
                $table->foreign('city_id')
                    ->references('id')
                    ->on('location_cities')
                    ->nullOnDelete();

                $table->foreign('village_id')
                    ->references('id')
                    ->on('location_villages')
                    ->nullOnDelete();

                // Indexes for performance optimization
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
        // Avoid destructive operations on production
    }
};
