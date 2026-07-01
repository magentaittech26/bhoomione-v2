<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\PromoCampaign;
use App\Models\PromoCoupon;
use Illuminate\Support\Str;

class SaasPromoFeatureTest extends TestCase
{
    /**
     * Test Campaign and Coupon creations and associations.
     */
    public function test_campaign_and_coupon_creation_flow()
    {
        $campaignId = (string) Str::uuid();
        $campaign = new PromoCampaign([
            'id' => $campaignId,
            'name' => 'Winter Festival Promo 2026',
            'type' => 'EMAIL',
            'channel' => 'Email',
            'status' => 'ACTIVE',
            'start_date' => '2026-11-01',
            'end_date' => '2026-12-31',
            'spend' => 5000.00,
            'revenue' => 12000.00,
            'leads' => 150,
            'conversions' => 45,
            'target_audience' => 'Premium Builders',
            'timezone' => 'Asia/Kolkata',
        ]);

        $this->assertEquals('Winter Festival Promo 2026', $campaign->name);
        $this->assertEquals('EMAIL', $campaign->type);

        $couponId = (string) Str::uuid();
        $coupon = new PromoCoupon([
            'id' => $couponId,
            'code' => 'WINTER25',
            'type' => 'PERCENTAGE',
            'value' => 25.00,
            'campaign_id' => $campaignId,
            'expiry_date' => '2026-12-31',
            'max_uses' => 100,
            'current_uses' => 10,
            'status' => 'ACTIVE'
        ]);

        $this->assertEquals('WINTER25', $coupon->code);
        $this->assertEquals(25.00, $coupon->value);
        $this->assertEquals($campaignId, $coupon->campaign_id);
    }

    /**
     * Test Coupon evaluation and validation rules inside simulated handshakes.
     */
    public function test_coupon_simulation_discount_calculation()
    {
        $coupon = new PromoCoupon([
            'code' => 'FLAT1000',
            'type' => 'FIXED',
            'value' => 1000.00,
            'expiry_date' => '2026-12-31',
            'max_uses' => 5,
            'current_uses' => 2,
            'status' => 'ACTIVE'
        ]);

        // Evaluate validation status
        $this->assertTrue(now()->lt(\Carbon\Carbon::parse($coupon->expiry_date)));
        $this->assertTrue($coupon->current_uses < $coupon->max_uses);

        // Fixed discount calculations
        $baseAmount = 5000.00;
        $discountAmount = min($coupon->value, $baseAmount);
        $finalAmount = max(0.00, $baseAmount - $discountAmount);

        $this->assertEquals(1000.00, $discountAmount);
        $this->assertEquals(4000.00, $finalAmount);
    }
}
