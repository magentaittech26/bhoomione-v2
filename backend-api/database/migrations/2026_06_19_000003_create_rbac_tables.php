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
        // 1. Roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('scope', 50)->default('TENANT'); // GLOBAL or TENANT
            $table->timestamps();
        });

        // 2. Permissions table
        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('code', 100)->unique();
            $table->string('name', 255);
            $table->string('module', 100);
            $table->timestamps();
        });

        // 3. Role-Permissions pivot table
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('permission_id');

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->primary(['role_id', 'permission_id']);
        });

        // 4. User-Roles pivot table for global administrative mappings
        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->uuid('role_id');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->primary(['user_id', 'role_id']);
        });

        // 5. Tenant-Users layout mapping users to tenants and roles
        Schema::create('tenant_users', function (Blueprint $table) {
            $table->uuid('tenant_id');
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('restrict');
            $table->primary(['tenant_id', 'user_id']);

            $table->index('tenant_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_users');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
