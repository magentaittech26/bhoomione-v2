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
        // Enable UUID extensions in PostgreSQL
        DB::statement('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        // Create Tenants table
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('tenant_code', 100)->unique();
            $table->string('company_name', 255);
            $table->string('status', 50)->default('PENDING'); // PENDING, ACTIVE, SUSPENDED, DELETED
            $table->timestamps();
        });

        // Create Tenant Domains table
        Schema::create('tenant_domains', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->string('domain_name', 255)->unique();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index('domain_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_domains');
        Schema::dropIfExists('tenants');
    }
};
