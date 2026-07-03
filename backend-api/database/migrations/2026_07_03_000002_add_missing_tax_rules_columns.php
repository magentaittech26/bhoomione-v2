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
        if (Schema::hasTable('tax_rules')) {
            Schema::table('tax_rules', function (Blueprint $table) {
                if (!Schema::hasColumn('tax_rules', 'effective_to')) {
                    $table->date('effective_to')->nullable();
                }
                if (!Schema::hasColumn('tax_rules', 'is_default')) {
                    $table->boolean('is_default')->default(false);
                }
                if (!Schema::hasColumn('tax_rules', 'builder_name')) {
                    $table->string('builder_name', 255)->nullable();
                }
                if (!Schema::hasColumn('tax_rules', 'amount_type')) {
                    $table->string('amount_type', 50)->default('percentage'); // 'percentage' or 'fixed'
                }
                if (!Schema::hasColumn('tax_rules', 'fixed_amount')) {
                    $table->decimal('fixed_amount', 15, 2)->default(0.00);
                }
                if (!Schema::hasColumn('tax_rules', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        if (Schema::hasTable('tax_transactions')) {
            Schema::table('tax_transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('tax_transactions', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('tax_rules')) {
            Schema::table('tax_rules', function (Blueprint $table) {
                $table->dropColumn([
                    'effective_to',
                    'is_default',
                    'builder_name',
                    'amount_type',
                    'fixed_amount',
                ]);
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('tax_transactions')) {
            Schema::table('tax_transactions', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
