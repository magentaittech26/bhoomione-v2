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
        if (Schema::hasTable('measurement_units')) {
            Schema::table('measurement_units', function (Blueprint $table) {
                if (!Schema::hasColumn('measurement_units', 'uuid')) {
                    $table->uuid('uuid')->nullable()->after('id');
                }
                if (!Schema::hasColumn('measurement_units', 'display_name')) {
                    $table->string('display_name', 255)->nullable()->after('name');
                }
                if (!Schema::hasColumn('measurement_units', 'symbol')) {
                    $table->string('symbol', 50)->nullable()->after('display_name');
                }
                if (!Schema::hasColumn('measurement_units', 'short_code')) {
                    $table->string('short_code', 50)->nullable()->after('symbol');
                }
                if (!Schema::hasColumn('measurement_units', 'measurement_type')) {
                    $table->string('measurement_type', 50)->default('Area')->after('short_code');
                }
                if (!Schema::hasColumn('measurement_units', 'conversion_factor')) {
                    $table->decimal('conversion_factor', 18, 8)->default(1.0)->after('measurement_type');
                }
                if (!Schema::hasColumn('measurement_units', 'base_unit')) {
                    $table->string('base_unit', 50)->nullable()->after('conversion_to_sqft');
                }
                if (!Schema::hasColumn('measurement_units', 'precision')) {
                    $table->integer('precision')->default(2)->after('base_unit');
                }
                if (!Schema::hasColumn('measurement_units', 'decimal_places')) {
                    $table->integer('decimal_places')->default(2)->after('precision');
                }
                if (!Schema::hasColumn('measurement_units', 'display_order')) {
                    $table->integer('display_order')->default(10)->after('decimal_places');
                }
                if (!Schema::hasColumn('measurement_units', 'is_metric')) {
                    $table->boolean('is_metric')->default(false)->after('display_order');
                }
                if (!Schema::hasColumn('measurement_units', 'is_default')) {
                    $table->boolean('is_default')->default(false)->after('is_metric');
                }
                if (!Schema::hasColumn('measurement_units', 'is_system')) {
                    $table->boolean('is_system')->default(true)->after('is_default');
                }
                if (!Schema::hasColumn('measurement_units', 'country_code')) {
                    $table->string('country_code', 10)->default('IN')->after('is_system');
                }
                if (!Schema::hasColumn('measurement_units', 'state_code')) {
                    $table->string('state_code', 10)->nullable()->after('country_code');
                }
                if (!Schema::hasColumn('measurement_units', 'tenant_id')) {
                    $table->uuid('tenant_id')->nullable()->after('state_code');
                }
                if (!Schema::hasColumn('measurement_units', 'tenant_override_allowed')) {
                    $table->boolean('tenant_override_allowed')->default(true)->after('tenant_id');
                }
                if (!Schema::hasColumn('measurement_units', 'description')) {
                    $table->text('description')->nullable()->after('tenant_override_allowed');
                }
                if (!Schema::hasColumn('measurement_units', 'created_by')) {
                    $table->uuid('created_by')->nullable()->after('description');
                }
                if (!Schema::hasColumn('measurement_units', 'updated_by')) {
                    $table->uuid('updated_by')->nullable()->after('created_by');
                }
                if (!Schema::hasColumn('measurement_units', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safely rollback added columns if needed
    }
};
