<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'lifecycle_status')) {
                $table->string('lifecycle_status', 50)->default('ACTIVE'); // ACTIVE, SUSPENDED, ARCHIVED, PENDING_DELETION, DELETED
            }
            if (!Schema::hasColumn('tenants', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'archived_at')) {
                $table->timestamp('archived_at')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'deletion_requested_at')) {
                $table->timestamp('deletion_requested_at')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'deletion_scheduled_at')) {
                $table->timestamp('deletion_scheduled_at')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'deleted_reason')) {
                $table->text('deleted_reason')->nullable();
            }
            if (!Schema::hasColumn('tenants', 'backup_reference')) {
                $table->string('backup_reference', 255)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'lifecycle_status',
                'suspended_at',
                'archived_at',
                'deletion_requested_at',
                'deletion_scheduled_at',
                'deleted_reason',
                'backup_reference'
            ]);
        });
    }
};
