<?php

namespace App\Policies;

use App\Models\User;
use App\Models\TaxTransaction;

class TaxTransactionPolicy
{
    /**
     * Determine whether the user can view the tax transaction.
     */
    public function view(User $user, TaxTransaction $transaction): bool
    {
        return $user->tenant_id === null || $user->tenant_id === $transaction->tenant_id;
    }

    /**
     * Determine whether the user can manage tax transactions.
     */
    public function manage(User $user, TaxTransaction $transaction): bool
    {
        return $user->tenant_id === null || $user->tenant_id === $transaction->tenant_id;
    }
}
