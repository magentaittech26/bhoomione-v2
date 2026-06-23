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
        Schema::create('tenant_billing_overrides', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_subscription_id')->unique();
            $table->decimal('custom_monthly_fee', 12, 2)->nullable();
            $table->decimal('custom_annual_fee', 12, 2)->nullable();
            $table->decimal('custom_discount_percentage', 5, 2)->default(0.00);
            $table->text('special_contract_notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_subscription_id')->references('id')->on('tenant_subscriptions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_billing_overrides');
    }
};
