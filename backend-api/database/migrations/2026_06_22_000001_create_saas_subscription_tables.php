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
        // 1. saas_modules
        Schema::create('saas_modules', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('group', 100);
            $table->text('description')->nullable();
            $table->string('status', 50)->default('ACTIVE');
            $table->boolean('is_core')->default(false);
            $table->boolean('is_billable')->default(true);
            $table->integer('sort_order')->default(10);
            $table->softDeletes();
            $table->timestamps();
        });

        // 2. saas_features
        Schema::create('saas_features', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('module_id');
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('group', 100)->nullable();
            $table->text('description')->nullable();
            $table->string('status', 50)->default('ACTIVE');
            $table->boolean('default_enabled')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('module_id')->references('id')->on('saas_modules')->onDelete('cascade');
        });

        // 3. subscription_plans
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('plan_code', 100)->unique();
            $table->string('name', 255);
            $table->decimal('monthly_price', 12, 2)->default(0.00);
            $table->decimal('yearly_price', 12, 2)->default(0.00);
            $table->integer('trial_days')->default(14);
            $table->string('status', 50)->default('ACTIVE');
            $table->integer('sort_order')->default(1);
            $table->softDeletes();
            $table->timestamps();
        });

        // 4. subscription_plan_features
        Schema::create('subscription_plan_features', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('plan_id');
            $table->uuid('feature_id');
            $table->string('access_level', 50)->default('ENABLED'); // ENABLED, DISABLED, ADDON, ENTERPRISE
            $table->timestamps();

            $table->foreign('plan_id')->references('id')->on('subscription_plans')->onDelete('cascade');
            $table->foreign('feature_id')->references('id')->on('saas_features')->onDelete('cascade');
            $table->unique(['plan_id', 'feature_id']);
        });

        // 5. subscription_plan_limits
        Schema::create('subscription_plan_limits', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('plan_id');
            $table->string('limit_key', 150);
            $table->integer('limit_value')->default(0);
            $table->timestamps();

            $table->foreign('plan_id')->references('id')->on('subscription_plans')->onDelete('cascade');
            $table->unique(['plan_id', 'limit_key']);
        });

        // 6. subscription_addons
        Schema::create('subscription_addons', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->decimal('monthly_price', 12, 2)->default(0.00);
            $table->decimal('yearly_price', 12, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->string('status', 50)->default('ACTIVE');
            $table->softDeletes();
            $table->timestamps();
        });

        // 7. subscription_plot_slabs
        Schema::create('subscription_plot_slabs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->integer('min_plots')->default(1);
            $table->integer('max_plots')->default(999999);
            $table->decimal('monthly_price', 12, 2)->default(0.00);
            $table->decimal('yearly_price', 12, 2)->default(0.00);
            $table->string('status', 50)->default('ACTIVE');
            $table->softDeletes();
            $table->timestamps();
        });

        // 8. tenant_subscriptions
        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id')->unique();
            $table->uuid('plan_id');
            $table->string('status', 50)->default('ACTIVE'); // ACTIVE, TRIAL, EXPIRED, SUSPENDED, ARCHIVED
            $table->date('subscription_start_date');
            $table->date('subscription_expiry_date');
            $table->date('trial_expiry_date')->nullable();
            $table->date('renewal_date')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('subscription_plans')->onDelete('restrict');
        });

        // 9. tenant_addons
        Schema::create('tenant_addons', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_subscription_id');
            $table->uuid('addon_id');
            $table->timestamp('assigned_at')->nullable();

            $table->foreign('tenant_subscription_id')->references('id')->on('tenant_subscriptions')->onDelete('cascade');
            $table->foreign('addon_id')->references('id')->on('subscription_addons')->onDelete('cascade');
            $table->unique(['tenant_subscription_id', 'addon_id']);
        });

        // 10. tenant_feature_overrides
        Schema::create('tenant_feature_overrides', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_subscription_id');
            $table->uuid('feature_id');
            $table->string('override_status', 50); // ENABLED, DISABLED, ADDON, ENTERPRISE
            $table->timestamps();

            $table->foreign('tenant_subscription_id')->references('id')->on('tenant_subscriptions')->onDelete('cascade');
            $table->foreign('feature_id')->references('id')->on('saas_features')->onDelete('cascade');
            $table->unique(['tenant_subscription_id', 'feature_id']);
        });

        // 11. tenant_limit_overrides
        Schema::create('tenant_limit_overrides', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_subscription_id');
            $table->string('limit_key', 150);
            $table->integer('override_value');
            $table->timestamps();

            $table->foreign('tenant_subscription_id')->references('id')->on('tenant_subscriptions')->onDelete('cascade');
            $table->unique(['tenant_subscription_id', 'limit_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_limit_overrides');
        Schema::dropIfExists('tenant_feature_overrides');
        Schema::dropIfExists('tenant_addons');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('subscription_plot_slabs');
        Schema::dropIfExists('subscription_addons');
        Schema::dropIfExists('subscription_plan_limits');
        Schema::dropIfExists('subscription_plan_features');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('saas_features');
        Schema::dropIfExists('saas_modules');
    }
};
