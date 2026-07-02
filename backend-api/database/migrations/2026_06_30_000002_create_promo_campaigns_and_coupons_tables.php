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
        Schema::create('promo_campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 255);
            $table->string('type', 50); // MARKETPLACE, FEATURED_BUILDER, FEATURED_PROJECT, HOMEPAGE_BANNER, EMAIL, WHATSAPP, PUSH, LEAD
            $table->string('channel', 50)->default('Direct'); // Email, Social, Direct, Partners
            $table->string('status', 50)->default('DRAFT'); // ACTIVE/RUNNING, PAUSED, COMPLETED, DRAFT
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('spend', 12, 2)->default(0.00);
            $table->decimal('revenue', 12, 2)->default(0.00);
            $table->integer('leads')->default(0);
            $table->integer('conversions')->default(0);
            $table->text('target_audience')->nullable();
            $table->string('timezone', 100)->default('Asia/Kolkata');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('promo_coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 100)->unique();
            $table->string('type', 50); // PERCENTAGE, FIXED, REFERRAL, BUILDER, MARKETPLACE, TENANT
            $table->decimal('value', 12, 2);
            $table->uuid('campaign_id')->nullable();
            $table->date('start_date')->nullable();
            $table->date('expiry_date');
            $table->integer('max_uses')->default(100);
            $table->integer('current_uses')->default(0);
            $table->string('tenant_id', 100)->nullable();
            $table->string('builder_name', 255)->nullable();
            $table->string('status', 50)->default('ACTIVE'); // ACTIVE, EXPIRED, EXHAUSTED
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('campaign_id')->references('id')->on('promo_campaigns')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promo_coupons');
        Schema::dropIfExists('promo_campaigns');
    }
};
