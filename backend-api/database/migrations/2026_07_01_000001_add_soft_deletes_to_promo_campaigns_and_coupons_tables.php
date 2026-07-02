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
        if (Schema::hasTable('promo_campaigns')) {
            Schema::table('promo_campaigns', function (Blueprint $table) {
                if (!Schema::hasColumn('promo_campaigns', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        if (Schema::hasTable('promo_coupons')) {
            Schema::table('promo_coupons', function (Blueprint $table) {
                if (!Schema::hasColumn('promo_coupons', 'deleted_at')) {
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
        if (Schema::hasTable('promo_campaigns')) {
            Schema::table('promo_campaigns', function (Blueprint $table) {
                if (Schema::hasColumn('promo_campaigns', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }

        if (Schema::hasTable('promo_coupons')) {
            Schema::table('promo_coupons', function (Blueprint $table) {
                if (Schema::hasColumn('promo_coupons', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};
