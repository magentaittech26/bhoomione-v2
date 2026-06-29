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
            if (!Schema::hasColumn('tenants', 'infrastructure_tier')) {
                $table->string('infrastructure_tier', 50)->default('SHARED');
            }
            if (!Schema::hasColumn('tenants', 'database_host')) {
                $table->string('database_host', 255)->nullable();
            }
            if (!Schema::hasColumn('tenants', 'database_name')) {
                $table->string('database_name', 255)->nullable();
            }
            if (!Schema::hasColumn('tenants', 'database_port')) {
                $table->integer('database_port')->nullable();
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
                'infrastructure_tier',
                'database_host',
                'database_name',
                'database_port',
            ]);
        });
    }
};
