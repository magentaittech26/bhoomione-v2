<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MarketplaceLead;

class MarketplaceLeadPolicy
{
    /**
     * Determine whether the user can view tenant marketplace leads.
     */
    public function viewAny(User $user): bool
    {
        return !empty($user->tenant_id);
    }

    /**
     * Determine whether the user can view a specific marketplace lead.
     */
    public function view(User $user, MarketplaceLead $lead): bool
    {
        return $user->tenant_id === $lead->tenant_id;
    }
}
