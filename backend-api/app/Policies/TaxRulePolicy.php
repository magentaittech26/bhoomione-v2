<?php

namespace App\Policies;

use App\Models\User;
use App\Models\TaxRule;

class TaxRulePolicy
{
    /**
     * Determine whether the user can view the tax rule.
     */
    public function view(User $user, TaxRule $rule): bool
    {
        // Admin (null tenant_id) or matching tenant can view
        return $user->tenant_id === null || $rule->tenant_id === null || $user->tenant_id === $rule->tenant_id;
    }

    /**
     * Determine whether the user can manage (create, update, delete) the tax rule.
     */
    public function manage(User $user, TaxRule $rule): bool
    {
        // Platform Admins can manage everything. Tenant admins can only manage their own tenant overrides.
        if ($user->tenant_id === null) {
            return true;
        }

        // If the tax rule is global (null tenant_id), tenant users cannot edit/manage it.
        if ($rule->tenant_id === null) {
            return false;
        }

        return $user->tenant_id === $rule->tenant_id;
    }
}
