<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentGatewaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        DB::table('payment_gateways')->delete();
        DB::table('payment_logs')->delete();
        DB::table('webhook_logs')->delete();

        $gateways = [
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'RAZORPAY',
                'name' => 'Razorpay',
                'is_enabled' => true,
                'environment' => 'SANDBOX',
                'api_key' => 'rzp_test_51O2aB6...',
                'secret_key' => 'sk_test_90XyZ1...',
                'webhook_secret' => 'whsec_rzp123',
                'currency' => 'INR',
                'status' => 'ACTIVE',
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'CASHFREE',
                'name' => 'Cashfree',
                'is_enabled' => false,
                'environment' => 'SANDBOX',
                'api_key' => 'cf_test_61P3cD8...',
                'secret_key' => 'sk_cf_80YaW2...',
                'webhook_secret' => 'whsec_cf123',
                'currency' => 'INR',
                'status' => 'ACTIVE',
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'PHONEPE',
                'name' => 'PhonePe',
                'is_enabled' => false,
                'environment' => 'SANDBOX',
                'api_key' => 'pp_test_71Q4eF9...',
                'secret_key' => 'sk_pp_70ZaV3...',
                'webhook_secret' => 'whsec_pp123',
                'currency' => 'INR',
                'status' => 'ACTIVE',
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'STRIPE',
                'name' => 'Stripe',
                'is_enabled' => false,
                'environment' => 'SANDBOX',
                'api_key' => 'pk_test_81R5fG0...',
                'secret_key' => 'sk_stripe_60WbU4...',
                'webhook_secret' => 'whsec_stripe123',
                'currency' => 'USD',
                'status' => 'ACTIVE',
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'PAYPAL',
                'name' => 'PayPal',
                'is_enabled' => false,
                'environment' => 'SANDBOX',
                'api_key' => 'client_paypal_91S...',
                'secret_key' => 'secret_paypal_50Xa...',
                'webhook_secret' => 'whsec_paypal123',
                'currency' => 'USD',
                'status' => 'ACTIVE',
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'MANUAL',
                'name' => 'Manual Payment',
                'is_enabled' => true,
                'environment' => 'PRODUCTION',
                'api_key' => null,
                'secret_key' => null,
                'webhook_secret' => null,
                'currency' => 'INR',
                'status' => 'ACTIVE',
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'BANK_TRANSFER',
                'name' => 'Bank Transfer',
                'is_enabled' => true,
                'environment' => 'PRODUCTION',
                'api_key' => null,
                'secret_key' => null,
                'webhook_secret' => null,
                'currency' => 'INR',
                'status' => 'ACTIVE',
                'is_default' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('payment_gateways')->insert($gateways);

        DB::table('payment_logs')->insert([
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'RAZORPAY',
                'transaction_id' => 'pay_Njd982Kds',
                'amount' => 2490.00,
                'currency' => 'INR',
                'status' => 'SUCCESS',
                'error_message' => null,
                'customer_email' => 'owner@developer1.com',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'RAZORPAY',
                'transaction_id' => 'pay_Kjs823Usa',
                'amount' => 990.00,
                'currency' => 'INR',
                'status' => 'FAILED',
                'error_message' => 'Insufficient funds / card declined',
                'customer_email' => 'customer@bhoomione.com',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'STRIPE',
                'transaction_id' => 'ch_1N92saK8s',
                'amount' => 49.00,
                'currency' => 'USD',
                'status' => 'SUCCESS',
                'error_message' => null,
                'customer_email' => 'owner@developer1.com',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('webhook_logs')->insert([
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'RAZORPAY',
                'event_type' => 'payment.authorized',
                'payload' => json_encode(['event' => 'payment.authorized', 'payload' => ['payment' => ['entity' => ['id' => 'pay_Njd982Kds', 'amount' => 249000]]]]),
                'status' => 'PROCESSED',
                'error_message' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string)Str::uuid(),
                'gateway_code' => 'STRIPE',
                'event_type' => 'charge.failed',
                'payload' => json_encode(['event' => 'charge.failed', 'payload' => ['charge' => ['entity' => ['id' => 'ch_failed_123', 'amount' => 4900]]]]),
                'status' => 'VERIFIED',
                'error_message' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
