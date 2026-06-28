<?php

namespace App\Jobs;

use App\Models\MarketplaceLead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendMarketplaceLeadNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $lead;

    /**
     * Create a new job instance.
     */
    public function __construct(MarketplaceLead $lead)
    {
        $this->lead = $lead;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Processing queued notification for Marketplace Lead: {$this->lead->id}", [
            'tenant_id' => $this->lead->tenant_id,
            'email' => $this->lead->email,
            'phone' => $this->lead->phone,
        ]);

        // Integrate with tenant CRM notification preferences
        // Send email, SMS, or webhook notification safely
    }
}
