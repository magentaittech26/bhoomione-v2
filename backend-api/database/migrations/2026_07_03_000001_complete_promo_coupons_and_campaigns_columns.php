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
        // 1. Ensure promo_campaigns table has all expected columns
        if (Schema::hasTable('promo_campaigns')) {
            Schema::table('promo_campaigns', function (Blueprint $table) {
                if (!Schema::hasColumn('promo_campaigns', 'id')) {
                    $table->uuid('id')->primary();
                }
                if (!Schema::hasColumn('promo_campaigns', 'name')) {
                    $table->string('name', 255)->nullable();
                }
                if (!Schema::hasColumn('promo_campaigns', 'type')) {
                    $table->string('type', 50)->nullable();
                }
                if (!Schema::hasColumn('promo_campaigns', 'channel')) {
                    $table->string('channel', 50)->default('Direct');
                }
                if (!Schema::hasColumn('promo_campaigns', 'status')) {
                    $table->string('status', 50)->default('DRAFT');
                }
                if (!Schema::hasColumn('promo_campaigns', 'start_date')) {
                    $table->date('start_date')->nullable();
                }
                if (!Schema::hasColumn('promo_campaigns', 'end_date')) {
                    $table->date('end_date')->nullable();
                }
                if (!Schema::hasColumn('promo_campaigns', 'spend')) {
                    $table->decimal('spend', 12, 2)->default(0.00);
                }
                if (!Schema::hasColumn('promo_campaigns', 'revenue')) {
                    $table->decimal('revenue', 12, 2)->default(0.00);
                }
                if (!Schema::hasColumn('promo_campaigns', 'leads')) {
                    $table->integer('leads')->default(0);
                }
                if (!Schema::hasColumn('promo_campaigns', 'conversions')) {
                    $table->integer('conversions')->default(0);
                }
                if (!Schema::hasColumn('promo_campaigns', 'target_audience')) {
                    $table->text('target_audience')->nullable();
                }
                if (!Schema::hasColumn('promo_campaigns', 'timezone')) {
                    $table->string('timezone', 100)->default('Asia/Kolkata');
                }
                if (!Schema::hasColumn('promo_campaigns', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        // 2. Ensure promo_coupons table has all expected columns
        if (Schema::hasTable('promo_coupons')) {
            Schema::table('promo_coupons', function (Blueprint $table) {
                if (!Schema::hasColumn('promo_coupons', 'id')) {
                    $table->uuid('id')->primary();
                }
                if (!Schema::hasColumn('promo_coupons', 'code')) {
                    $table->string('code', 100)->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'type')) {
                    $table->string('type', 50)->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'value')) {
                    $table->decimal('value', 12, 2)->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'campaign_id')) {
                    $table->uuid('campaign_id')->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'start_date')) {
                    $table->date('start_date')->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'expiry_date')) {
                    $table->date('expiry_date')->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'max_uses')) {
                    $table->integer('max_uses')->default(100);
                }
                if (!Schema::hasColumn('promo_coupons', 'current_uses')) {
                    $table->integer('current_uses')->default(0);
                }
                if (!Schema::hasColumn('promo_coupons', 'tenant_id')) {
                    $table->string('tenant_id', 100)->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'builder_name')) {
                    $table->string('builder_name', 255)->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'status')) {
                    $table->string('status', 50)->default('ACTIVE');
                }
                if (!Schema::hasColumn('promo_coupons', 'discount_type')) {
                    $table->string('discount_type', 50)->nullable();
                }
                if (!Schema::hasColumn('promo_coupons', 'discount_value')) {
                    $table->decimal('discount_value', 12, 2)->nullable();
                }
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
        // For safety of production data, we do not drop columns in down.
    }
};
