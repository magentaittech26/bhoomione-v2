<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('gateway_code', 50)->unique();
            $table->string('name', 100);
            $table->boolean('is_enabled')->default(false);
            $table->string('environment', 20)->default('SANDBOX');
            $table->string('api_key', 255)->nullable();
            $table->string('secret_key', 255)->nullable();
            $table->string('webhook_secret', 255)->nullable();
            $table->string('currency', 10)->default('INR');
            $table->string('status', 50)->default('ACTIVE');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('payment_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('gateway_code', 50);
            $table->string('transaction_id', 100)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('INR');
            $table->string('status', 50)->default('PENDING');
            $table->text('error_message')->nullable();
            $table->string('customer_email', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });

        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('gateway_code', 50);
            $table->string('event_type', 100);
            $table->text('payload');
            $table->string('status', 50)->default('PROCESSED');
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('webhook_logs');
        Schema::dropIfExists('payment_logs');
        Schema::dropIfExists('payment_gateways');
    }
};
