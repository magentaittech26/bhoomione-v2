<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PromoCampaign;

class PromoCampaignPolicy
{
    /**
     * Determine whether the user can view the campaign.
     */
    public function view(User $user, PromoCampaign $campaign): bool
    {
        return true; // Campaigns can be viewed globally or scoped by role/tenant as needed
    }

    /**
     * Determine whether the user can manage the campaign.
     */
    public function manage(User $user, PromoCampaign $campaign): bool
    {
        return $user->tenant_id === null; // Platform admins manage campaigns
    }
}
