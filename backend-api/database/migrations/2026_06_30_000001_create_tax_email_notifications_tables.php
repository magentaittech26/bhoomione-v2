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
        if (!Schema::hasTable('tax_rules')) {
            Schema::create('tax_rules', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id')->nullable();
                $table->string('tax_type', 50); // 'GST', 'CGST', 'SGST', 'IGST', 'TDS', 'STAMP_DUTY', 'REGISTRATION', 'OTHER'
                $table->string('name', 100);
                $table->decimal('rate_percentage', 5, 2)->default(0.00);
                $table->string('state_code', 10)->default('ALL'); // 'KA', 'MH', 'DL', 'HR', 'ALL'
                $table->date('effective_from')->default(DB::raw('CURRENT_DATE'));
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->index('tenant_id', 'idx_tax_rules_tenant');
                $table->index('state_code', 'idx_tax_rules_state');
            });
        }

        if (!Schema::hasTable('tax_transactions')) {
            Schema::create('tax_transactions', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->uuid('tenant_id');
                $table->string('invoice_number', 100);
                $table->string('customer_name', 255);
                $table->string('state_code', 10);
                $table->decimal('base_amount', 15, 2);
                $table->decimal('cgst_amount', 15, 2)->default(0.00);
                $table->decimal('sgst_amount', 15, 2)->default(0.00);
                $table->decimal('igst_amount', 15, 2)->default(0.00);
                $table->decimal('tds_amount', 15, 2)->default(0.00);
                $table->decimal('stamp_duty_amount', 15, 2)->default(0.00);
                $table->decimal('registration_charges', 15, 2)->default(0.00);
                $table->decimal('other_charges', 15, 2)->default(0.00);
                $table->decimal('total_tax_amount', 15, 2)->default(0.00);
                $table->decimal('total_invoice_amount', 15, 2)->default(0.00);
                $table->timestamp('created_at')->useCurrent();

                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                $table->index('tenant_id', 'idx_tax_transactions_tenant');
                $table->index('invoice_number', 'idx_tax_transactions_invoice');
            });
        }

        if (!Schema::hasTable('email_configurations')) {
            Schema::create('email_configurations', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('provider_code', 50)->unique(); // 'SMTP', 'SES', 'MAILGUN', etc.
                $table->string('name', 100);
                $table->boolean('is_enabled')->default(false);
                $table->boolean('is_default')->default(false);
                $table->string('host', 255)->nullable();
                $table->integer('port')->nullable();
                $table->string('encryption', 20)->nullable();
                $table->string('username', 255)->nullable();
                $table->text('password')->nullable();
                $table->string('sender_name', 255);
                $table->string('sender_email', 255);
                $table->jsonb('custom_params')->nullable();
                $table->string('status', 50)->default('INACTIVE');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('email_templates')) {
            Schema::create('email_templates', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('template_key', 50)->unique(); // 'WELCOME', 'PASSWORD_RESET', etc.
                $table->string('name', 100);
                $table->string('subject', 255);
                $table->text('body_html');
                $table->text('body_text')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('email_logs')) {
            Schema::create('email_logs', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('provider_code', 50)->nullable();
                $table->string('template_key', 50)->nullable();
                $table->string('recipient_email', 255);
                $table->string('recipient_name', 255)->nullable();
                $table->string('subject', 255);
                $table->text('body_html');
                $table->string('status', 50); // 'QUEUED', 'DELIVERED', 'BOUNCED', 'FAILED'
                $table->text('error_message')->nullable();
                $table->integer('retry_count')->default(0);
                $table->integer('max_retries')->default(3);
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();

                $table->index('status', 'idx_email_logs_status');
                $table->index('recipient_email', 'idx_email_logs_recipient');
                $table->index('created_at', 'idx_email_logs_created_at');
            });
        }

        if (!Schema::hasTable('notification_configurations')) {
            Schema::create('notification_configurations', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('channel', 50); // 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', etc.
                $table->string('provider_code', 50);
                $table->string('name', 100);
                $table->boolean('is_enabled')->default(false);
                $table->boolean('is_default')->default(false);
                $table->jsonb('config_params')->nullable();
                $table->string('status', 50)->default('INACTIVE');
                $table->timestamps();

                $table->unique(['channel', 'provider_code'], 'unique_channel_provider');
            });
        }

        if (!Schema::hasTable('notification_templates')) {
            Schema::create('notification_templates', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('event_type', 100)->unique(); // 'TENANT_CREATED', 'BOOKING', etc.
                $table->string('name', 150);
                $table->string('email_subject', 255)->nullable();
                $table->text('email_body_html')->nullable();
                $table->text('sms_template')->nullable();
                $table->text('whatsapp_template')->nullable();
                $table->string('push_title', 255)->nullable();
                $table->text('push_body')->nullable();
                $table->text('in_app_body')->nullable();
                $table->text('webhook_payload_template')->nullable();
                $table->string('whatsapp_media_url', 512)->nullable();
                $table->string('whatsapp_media_type', 50)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('notification_logs')) {
            Schema::create('notification_logs', function (Blueprint $table) {
                $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
                $table->string('event_type', 100);
                $table->string('channel', 50); // 'EMAIL', 'SMS', 'WHATSAPP', etc.
                $table->string('recipient', 255);
                $table->string('subject', 255)->nullable();
                $table->text('body');
                $table->string('status', 50)->default('QUEUED');
                $table->integer('retry_count')->default(0);
                $table->integer('max_retries')->default(3);
                $table->timestamp('scheduled_at')->useCurrent();
                $table->timestamp('sent_at')->nullable();
                $table->text('error_message')->nullable();
                $table->jsonb('audit_trail')->nullable();
                $table->string('whatsapp_media_url', 512)->nullable();
                $table->string('whatsapp_media_type', 50)->nullable();
                $table->timestamps();

                $table->index('status', 'idx_notification_logs_status');
                $table->index('channel', 'idx_notification_logs_channel');
                $table->index('created_at', 'idx_notification_logs_created');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notification_logs');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('notification_configurations');
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('email_templates');
        Schema::dropIfExists('email_configurations');
        Schema::dropIfExists('tax_transactions');
        Schema::dropIfExists('tax_rules');
    }
};
