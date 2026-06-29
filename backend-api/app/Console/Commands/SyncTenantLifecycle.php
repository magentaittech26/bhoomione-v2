<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SyncTenantLifecycle extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:sync-lifecycle {--dry-run : Run the check without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automate tenant lifecycle non-renewal checks (suspension after grace period, pending deletion after retention period)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $this->info("Starting Tenant Lifecycle & Non-renewal synchronization (Dry Run: " . ($dryRun ? 'YES' : 'NO') . ")");

        // Find all active/trial subscriptions
        $subscriptions = TenantSubscription::with('tenant')
            ->whereIn('status', ['ACTIVE', 'TRIAL'])
            ->get();

        $today = now()->startOfDay();
        $graceDays = 7;      // grace period before suspension
        $retentionDays = 30;  // retention period before marking pending deletion

        $suspendedCount = 0;
        $pendingDeletionCount = 0;

        foreach ($subscriptions as $sub) {
            $tenant = $sub->tenant;
            if (!$tenant) {
                continue;
            }

            $expiryDate = $sub->subscription_expiry_date;
            if (!$expiryDate) {
                continue;
            }

            $expiryDate = \Carbon\Carbon::parse($expiryDate);
            $daysSinceExpiry = $expiryDate->diffInDays($today, false);

            if ($daysSinceExpiry <= 0) {
                // Subscription is still active
                continue;
            }

            // Case A: Exceeded retention period (e.g. 30 days) -> Mark Pending Deletion
            if ($daysSinceExpiry > $retentionDays) {
                if ($tenant->status !== 'PENDING_DELETION') {
                    $this->info("Tenant '{$tenant->tenant_code}' has been expired for {$daysSinceExpiry} days. Marking as PENDING_DELETION.");
                    
                    if (!$dryRun) {
                        DB::transaction(function () use ($tenant, $sub) {
                            $oldStatus = $tenant->status;
                            $tenant->status = 'PENDING_DELETION';
                            $tenant->lifecycle_status = 'PENDING_DELETION';
                            $tenant->deletion_requested_at = now();
                            $tenant->deletion_scheduled_at = now()->addDays(14);
                            $tenant->deleted_reason = "Automated non-renewal: Exceeded retention period of {$daysSinceExpiry} days since expiry date ({$sub->subscription_expiry_date->toDateString()}).";
                            $tenant->save();

                            $sub->status = 'EXPIRED';
                            $sub->save();

                            DB::table('tenant_lifecycle_events')->insert([
                                'id' => (string) Str::uuid(),
                                'tenant_id' => $tenant->id,
                                'old_status' => $oldStatus,
                                'new_status' => 'PENDING_DELETION',
                                'reason' => 'Automated non-renewal: Exceeded retention period. Scheduled for purge.',
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        });
                    }
                    $pendingDeletionCount++;
                }
            } 
            // Case B: Exceeded grace period (e.g. 7 days) -> Suspend
            elseif ($daysSinceExpiry > $graceDays) {
                if ($tenant->status !== 'SUSPENDED' && $tenant->status !== 'PENDING_DELETION') {
                    $this->info("Tenant '{$tenant->tenant_code}' has been expired for {$daysSinceExpiry} days. Suspending tenant.");
                    
                    if (!$dryRun) {
                        DB::transaction(function () use ($tenant, $sub) {
                            $oldStatus = $tenant->status;
                            $tenant->status = 'SUSPENDED';
                            $tenant->lifecycle_status = 'SUSPENDED';
                            $tenant->suspended_at = now();
                            $tenant->deleted_reason = "Automated non-renewal: Exceeded grace period of {$daysSinceExpiry} days since expiry date ({$sub->subscription_expiry_date->toDateString()}).";
                            $tenant->save();

                            $sub->status = 'SUSPENDED';
                            $sub->save();

                            DB::table('tenant_lifecycle_events')->insert([
                                'id' => (string) Str::uuid(),
                                'tenant_id' => $tenant->id,
                                'old_status' => $oldStatus,
                                'new_status' => 'SUSPENDED',
                                'reason' => 'Automated non-renewal: Exceeded grace period. Logins disabled.',
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        });
                    }
                    $suspendedCount++;
                }
            }
        }

        $this->info("Sync completed: Suspended: {$suspendedCount}, Marked Pending Deletion: {$pendingDeletionCount}");
        
        return Command::SUCCESS;
    }
}
