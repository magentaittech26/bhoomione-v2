<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('business_rule_evaluations')) {
            Schema::create('business_rule_evaluations', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('tenant_id')->nullable()->index();
                $table->uuid('actor_id')->nullable()->index();
                $table->string('action', 100)->index();
                $table->string('entity_type', 100)->index();
                $table->string('entity_id', 100)->nullable();
                $table->boolean('passed')->default(true);
                $table->integer('blocking_count')->default(0);
                $table->integer('warning_count')->default(0);
                $table->float('execution_time_ms')->default(0);
                $table->string('mode', 20)->default('ENFORCE');
                $table->string('execution_source', 30)->default('WEB');
                $table->string('correlation_id', 100)->nullable()->index();
                $table->timestamp('created_at')->useCurrent()->index();
            });
        }

        if (!Schema::hasTable('business_rule_evaluation_results')) {
            Schema::create('business_rule_evaluation_results', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('evaluation_id')->index();
                $table->string('rule_code', 100)->index();
                $table->string('rule_version', 20)->default('1.0.0');
                $table->boolean('passed')->default(true);
                $table->string('severity', 20)->default('BLOCKING');
                $table->string('error_code', 100)->nullable();
                $table->text('message');
                $table->text('user_message')->nullable();
                $table->text('developer_message')->nullable();
                $table->text('remediation')->nullable();
                $table->json('evidence')->nullable();
                $table->json('failed_conditions')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('evaluation_id')->references('id')->on('business_rule_evaluations')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('tenant_business_rule_policies')) {
            Schema::create('tenant_business_rule_policies', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('tenant_id')->index();
                $table->string('rule_code', 100)->index();
                $table->json('parameters')->nullable();
                $table->boolean('is_enabled')->default(true);
                $table->string('version', 20)->default('1.0.0');
                $table->timestamps();

                $table->unique(['tenant_id', 'rule_code']);
            });
        }

        if (!Schema::hasTable('business_rule_overrides')) {
            Schema::create('business_rule_overrides', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('tenant_id')->index();
                $table->string('rule_code', 100)->index();
                $table->string('entity_type', 100);
                $table->string('entity_id', 100);
                $table->text('reason');
                $table->uuid('requested_by')->index();
                $table->uuid('approved_by')->nullable()->index();
                $table->string('status', 20)->default('APPROVED')->index(); // REQUESTED, APPROVED, REJECTED, EXPIRED, REVOKED, USED
                $table->timestamp('expires_at')->nullable();
                $table->json('evidence')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('business_rule_overrides');
        Schema::dropIfExists('tenant_business_rule_policies');
        Schema::dropIfExists('business_rule_evaluation_results');
        Schema::dropIfExists('business_rule_evaluations');
    }
};
