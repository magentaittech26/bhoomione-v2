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
        // 1. Create saas_platform_settings
        Schema::create('saas_platform_settings', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('setting_group', 100);
            $table->string('setting_key', 100)->unique();
            $table->text('setting_value')->nullable();
            $table->string('setting_type', 50)->default('string');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        // 2. Alter subscription_plot_slabs
        Schema::table('subscription_plot_slabs', function (Blueprint $table) {
            $table->decimal('one_time_license_price', 12, 2)->default(0.00)->after('yearly_price');
            $table->decimal('amc_price', 12, 2)->default(0.00)->after('one_time_license_price');
            $table->integer('sort_order')->default(0)->after('amc_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plot_slabs', function (Blueprint $table) {
            $table->dropColumn(['one_time_license_price', 'amc_price', 'sort_order']);
        });

        Schema::dropIfExists('saas_platform_settings');
    }
};
