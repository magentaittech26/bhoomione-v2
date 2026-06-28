<?php

namespace App\Policies;

use App\Models\User;
use App\Models\DeveloperProfile;

class DeveloperProfilePolicy
{
    /**
     * Determine whether the user can view the developer profile.
     */
    public function view(User $user, DeveloperProfile $profile): bool
    {
        return $user->tenant_id === $profile->tenant_id;
    }

    /**
     * Determine whether the user can update the developer profile.
     */
    public function update(User $user, DeveloperProfile $profile): bool
    {
        return $user->tenant_id === $profile->tenant_id;
    }
}
