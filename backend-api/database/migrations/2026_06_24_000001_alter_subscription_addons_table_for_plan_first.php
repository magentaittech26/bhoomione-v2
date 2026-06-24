<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscription_addons', function (Blueprint $table) {
            if (!Schema::hasColumn('subscription_addons', 'addon_type')) {
                $table->string('addon_type', 50)->default('FEATURE');
            }
            if (!Schema::hasColumn('subscription_addons', 'one_time_price')) {
                $table->decimal('one_time_price', 12, 2)->default(0.00);
            }
            if (!Schema::hasColumn('subscription_addons', 'feature_code')) {
                $table->string('feature_code', 100)->nullable();
            }
            if (!Schema::hasColumn('subscription_addons', 'limit_key')) {
                $table->string('limit_key', 100)->nullable();
            }
            if (!Schema::hasColumn('subscription_addons', 'limit_increment')) {
                $table->integer('limit_increment')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_addons', function (Blueprint $table) {
            $table->dropColumn(['addon_type', 'one_time_price', 'feature_code', 'limit_key', 'limit_increment']);
        });
    }
};
