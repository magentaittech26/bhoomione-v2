<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. saas_invoices table
        Schema::create('saas_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('tenant_id');
            $table->string('invoice_number', 100)->unique();
            $table->string('billing_period', 100);
            $table->string('subscription_plan_code', 100);
            $table->string('subscription_plan_name', 255);
            $table->decimal('base_amount', 15, 2);
            $table->decimal('cgst_amount', 15, 2)->default(0.00);
            $table->decimal('sgst_amount', 15, 2)->default(0.00);
            $table->decimal('igst_amount', 15, 2)->default(0.00);
            $table->decimal('total_tax_amount', 15, 2)->default(0.00);
            $table->decimal('total_invoice_amount', 15, 2);
            $table->decimal('outstanding_balance', 15, 2);
            $table->string('status', 50)->default('UNPAID'); // 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'OVERDUE', 'VOID'
            $table->string('created_by', 255)->nullable()->default('System');
            $table->string('updated_by', 255)->nullable()->default('System');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            
            // Indexes
            $table->index('tenant_id', 'idx_saas_invoices_tenant');
            $table->index('invoice_number', 'idx_saas_invoices_number');
        });

        // 2. invoice_payments table
        Schema::create('invoice_payments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('invoice_id');
            $table->date('payment_date');
            $table->decimal('amount', 15, 2);
            $table->string('payment_method', 50); // 'CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'GATEWAY'
            $table->string('reference_id', 100)->nullable();
            $table->text('remarks')->nullable();
            $table->string('recorded_by', 255)->nullable()->default('System');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('invoice_id')->references('id')->on('saas_invoices')->onDelete('cascade');
            
            // Indexes
            $table->index('invoice_id', 'idx_invoice_payments_invoice');
        });

        // 3. invoice_credits_refunds table
        Schema::create('invoice_credits_refunds', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('invoice_id');
            $table->string('type', 50); // 'CREDIT_NOTE', 'REFUND'
            $table->decimal('amount', 15, 2);
            $table->text('reason');
            $table->string('issued_by', 255)->nullable()->default('System');
            $table->timestamp('issued_at')->useCurrent();

            $table->foreign('invoice_id')->references('id')->on('saas_invoices')->onDelete('cascade');
        });

        // 4. invoice_audits table
        Schema::create('invoice_audits', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('invoice_id');
            $table->string('action', 100); // 'CREATED', 'UPDATED', 'SENT', 'PAYMENT_RECORDED', 'CREDIT_ISSUED', 'REFUND_ISSUED'
            $table->string('performed_by', 255);
            $table->text('details')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('invoice_id')->references('id')->on('saas_invoices')->onDelete('cascade');

            // Indexes
            $table->index('invoice_id', 'idx_invoice_audits_invoice');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('invoice_audits');
        Schema::dropIfExists('invoice_credits_refunds');
        Schema::dropIfExists('invoice_payments');
        Schema::dropIfExists('saas_invoices');
    }
};
