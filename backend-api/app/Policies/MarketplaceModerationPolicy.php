<?php

namespace App\Policies;

use App\Models\User;

class MarketplaceModerationPolicy
{
    /**
     * Determine whether the user is a platform admin who can moderate.
     */
    public function moderate(User $user): bool
    {
        // Platform Admins don't have tenant_id associated, or have specific roles
        return empty($user->tenant_id);
    }
}
