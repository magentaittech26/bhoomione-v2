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
        // 1. tenant_provisioning_jobs
        Schema::create('tenant_provisioning_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->string('job_type', 100); // CREATE, ACTIVATE, SUSPEND, RESUME, CANCEL, CHANGE_PLAN, ASSIGN_ADDON, REMOVE_ADDON, ATTACH_DOMAIN
            $table->string('status', 50)->default('PENDING'); // PENDING, RUNNING, SUCCESS, FAILED
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // 2. tenant_domains modifications / fallback creation
        if (Schema::hasTable('tenant_domains')) {
            // Compute existing columns BEFORE we initiate our Schema::table closure to prevent nested Schema facade evaluation issues.
            $hasDomain = Schema::hasColumn('tenant_domains', 'domain');
            $hasType = Schema::hasColumn('tenant_domains', 'type');
            $hasSslStatus = Schema::hasColumn('tenant_domains', 'ssl_status');
            $hasDnsStatus = Schema::hasColumn('tenant_domains', 'dns_status');
            $hasVerifiedAt = Schema::hasColumn('tenant_domains', 'verified_at');

            // Only modify structural columns if they are missing
            if (!$hasDomain || !$hasType || !$hasSslStatus || !$hasDnsStatus || !$hasVerifiedAt) {
                Schema::table('tenant_domains', function (Blueprint $table) use ($hasDomain, $hasType, $hasSslStatus, $hasDnsStatus, $hasVerifiedAt) {
                    if (!$hasDomain) {
                        $table->string('domain', 255)->nullable();
                    }
                    if (!$hasType) {
                        $table->string('type', 50)->default('SUBDOMAIN'); // SUBDOMAIN, CUSTOM
                    }
                    if (!$hasSslStatus) {
                        $table->string('ssl_status', 50)->nullable();
                    }
                    if (!$hasDnsStatus) {
                        $table->string('dns_status', 50)->nullable();
                    }
                    if (!$hasVerifiedAt) {
                        $table->timestamp('verified_at')->nullable();
                    }
                });
            }
        } else {
            Schema::create('tenant_domains', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('domain', 255)->unique();
                $table->string('domain_name', 255)->nullable(); // duplicate for TenantResolverMiddleware compatibility
                $table->string('type', 50)->default('SUBDOMAIN');
                $table->boolean('is_primary')->default(true);
                $table->string('ssl_status', 50)->nullable();
                $table->string('dns_status', 50)->nullable();
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->index('domain');
            });
        }

        // 3. tenant_lifecycle_events
        Schema::create('tenant_lifecycle_events', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->string('old_status', 50)->nullable();
            $table->string('new_status', 50);
            $table->text('reason')->nullable();
            $table->uuid('changed_by')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_lifecycle_events');
        Schema::dropIfExists('tenant_provisioning_jobs');
        
        // Since safe rollback state tracking of pre-existing columns inside 'tenant_domains' is stateless 
        // across independent sessions, we omit dropping tenant_domains columns on rollback to prevent 
        // accidental data loss on custom database entries in staging or live environments.
    }
};
