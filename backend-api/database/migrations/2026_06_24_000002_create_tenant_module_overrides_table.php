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
        if (!Schema::hasTable('tenant_module_overrides')) {
            Schema::create('tenant_module_overrides', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('tenant_subscription_id');
                $table->uuid('module_id');
                $table->string('override_status', 50); // ENABLED, DISABLED
                $table->timestamps();

                $table->foreign('tenant_subscription_id')->references('id')->on('tenant_subscriptions')->onDelete('cascade');
                $table->foreign('module_id')->references('id')->on('saas_modules')->onDelete('cascade');
                $table->unique(['tenant_subscription_id', 'module_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_module_overrides');
    }
};
