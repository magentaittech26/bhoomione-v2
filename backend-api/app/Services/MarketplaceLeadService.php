<?php

namespace App\Services;

use App\Models\MarketplaceLead;
use App\Models\Tenant;
use Illuminate\Support\Str;

class MarketplaceLeadService
{
    /**
     * Submit a marketplace lead with duplicate protection.
     */
    public function submitLead(array $data): MarketplaceLead
    {
        $tenantId = $data['tenant_id'];
        $phone = $data['phone'];
        $email = $data['email'];
        $leadType = $data['lead_type'] ?? 'General Enquiry';

        // Check for duplicate in the last 24 hours
        $existingLead = MarketplaceLead::where('tenant_id', $tenantId)
            ->where('phone', $phone)
            ->where('email', $email)
            ->where('lead_type', $leadType)
            ->where('created_at', '>=', now()->subHours(24))
            ->first();

        if ($existingLead) {
            $existingLead->update([
                'message' => !empty($data['message']) ? ($existingLead->message . ' | Follow-up: ' . $data['message']) : $existingLead->message,
                'metadata' => array_merge($existingLead->metadata ?: [], [
                    'follow_up_at' => now()->toIso8601String()
                ])
            ]);

            return $existingLead;
        }

        // Create new marketplace lead
        $lead = MarketplaceLead::create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'email' => $email,
            'phone' => $phone,
            'lead_type' => $leadType,
            'message' => $data['message'] ?? null,
            'metadata' => array_merge($data['metadata'] ?? [], [
                'captured_at' => now()->toIso8601String(),
                'source' => 'Marketplace Gateway'
            ]),
            'status' => 'Marketplace Lead' // Initial state of pipeline
        ]);

        // Dispatch background notification job
        try {
            \App\Jobs\SendMarketplaceLeadNotification::dispatch($lead);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Could not dispatch background notification for lead {$lead->id}: " . $e->getMessage());
        }

        return $lead;
    }
}
