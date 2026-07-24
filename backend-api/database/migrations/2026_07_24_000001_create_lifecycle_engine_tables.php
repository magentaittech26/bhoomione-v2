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
        if (!Schema::hasTable('lifecycle_transitions')) {
            Schema::create('lifecycle_transitions', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->uuid('organization_id')->nullable();
                $table->string('lifecycle_code', 100);
                $table->string('lifecycle_version', 20)->default('1.0.0');
                $table->string('entity_type', 100);
                $table->string('entity_id', 100);
                $table->string('transition_code', 100);
                $table->string('previous_state', 50);
                $table->string('destination_state', 50);
                $table->string('actor_id', 100)->nullable();
                $table->string('execution_source', 50)->default('WEB');
                $table->text('reason')->nullable();
                $table->uuid('business_rule_evaluation_id')->nullable();
                $table->uuid('override_id')->nullable();
                $table->string('correlation_id', 100);
                $table->jsonb('metadata')->default(DB::raw("'{}'::jsonb"));
                $table->timestamp('transitioned_at')->useCurrent();
                $table->uuid('reversed_transition_id')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'entity_type', 'entity_id'], 'idx_lifecycle_hist_entity');
                $table->index(['tenant_id', 'lifecycle_code'], 'idx_lifecycle_hist_code');
                $table->index('correlation_id', 'idx_lifecycle_hist_correlation');
                $table->index('transitioned_at', 'idx_lifecycle_hist_transitioned');
            });
        }

        if (!Schema::hasTable('tenant_lifecycle_policies')) {
            Schema::create('tenant_lifecycle_policies', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('lifecycle_code', 100);
                $table->jsonb('parameters')->default(DB::raw("'{}'::jsonb"));
                $table->boolean('is_enabled')->default(true);
                $table->string('version', 20)->default('1.0.0');
                $table->timestamps();

                $table->unique(['tenant_id', 'lifecycle_code'], 'uniq_tenant_lifecycle_policy');
            });
        }

        if (!Schema::hasTable('lifecycle_idempotency_records')) {
            Schema::create('lifecycle_idempotency_records', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('idempotency_key', 255);
                $table->string('lifecycle_code', 100);
                $table->string('entity_type', 100);
                $table->string('entity_id', 100);
                $table->string('transition_code', 100);
                $table->uuid('transition_id');
                $table->string('request_hash', 64)->nullable();
                $table->jsonb('response_payload')->default(DB::raw("'{}'::jsonb"));
                $table->timestamps();

                $table->unique(['tenant_id', 'idempotency_key'], 'uniq_tenant_idempotency_key');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lifecycle_idempotency_records');
        Schema::dropIfExists('tenant_lifecycle_policies');
        Schema::dropIfExists('lifecycle_transitions');
    }
};
