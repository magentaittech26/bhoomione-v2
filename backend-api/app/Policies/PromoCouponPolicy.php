<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PromoCoupon;

class PromoCouponPolicy
{
    /**
     * Determine whether the user can view the coupon.
     */
    public function view(User $user, PromoCoupon $coupon): bool
    {
        // Admin or the tenant owner can view the coupon
        return $user->tenant_id === null || $user->tenant_id === $coupon->tenant_id;
    }

    /**
     * Determine whether the user can manage (create, update, delete) the coupon.
     */
    public function manage(User $user, PromoCoupon $coupon): bool
    {
        return $user->tenant_id === null || $user->tenant_id === $coupon->tenant_id;
    }
}
