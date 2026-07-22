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
        if (!Schema::hasTable('tenant_measurement_unit_settings')) {
            Schema::create('tenant_measurement_unit_settings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('uuid')->nullable();
                $table->uuid('tenant_id');
                $table->uuid('measurement_unit_id');
                $table->boolean('is_enabled')->default(true);
                $table->boolean('is_default')->default(false);
                $table->integer('display_precision')->nullable();
                $table->integer('decimal_places_override')->nullable();
                $table->integer('display_order')->default(10);
                $table->string('custom_label', 255)->nullable();
                $table->string('custom_symbol', 50)->nullable();
                $table->uuid('created_by')->nullable();
                $table->uuid('updated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->foreign('measurement_unit_id')->references('id')->on('measurement_units')->onDelete('cascade');
                $table->unique(['tenant_id', 'measurement_unit_id'], 'tenant_unit_setting_unique');
                $table->index('tenant_id', 'idx_tenant_unit_settings_tenant');
                $table->index(['tenant_id', 'is_default'], 'idx_tenant_unit_settings_default');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_measurement_unit_settings');
    }
};
