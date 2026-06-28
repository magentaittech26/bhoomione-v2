<?php

namespace App\Services;

use App\Models\Project;
use App\Models\DeveloperProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MarketplaceModerationService
{
    /**
     * Moderate a project listing (Approve, Reject, Feature, Suspend, Restore, Hide).
     */
    public function moderateProject(Project $project, string $status, string $reason, string $moderator = 'Central Platform Admin'): Project
    {
        $oldStatus = $project->publishing_status;

        // Perform moderation state transitions
        $project->update([
            'publishing_status' => $status,
            'is_featured' => ($status === 'Featured') ? true : ($status === 'Published' ? false : $project->is_featured),
            'moderation_status' => ($status === 'Published' || $status === 'Featured') ? 'APPROVED' : (($status === 'Archived') ? 'REJECTED' : 'PENDING'),
            'moderation_history' => array_merge($project->moderation_history ?: [], [
                [
                    'action' => $status,
                    'reason' => $reason,
                    'moderated_by' => $moderator,
                    'timestamp' => now()->toIso8601String()
                ]
            ])
        ]);

        // Insert into immutable marketplace_moderation_history table
        DB::table('marketplace_moderation_history')->insert([
            'id' => Str::uuid()->toString(),
            'project_id' => $project->id,
            'status' => $status,
            'reason' => $reason,
            'moderated_by' => $moderator,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return $project;
    }

    /**
     * Moderate a Developer Profile (Approve, Reject, Verify).
     */
    public function moderateDeveloper(DeveloperProfile $developer, string $status, string $reason, string $moderator = 'Central Platform Admin'): DeveloperProfile
    {
        $developer->update([
            'verification_status' => $status,
            'description' => $developer->description . "\n[Moderation Note ({$status}) - {$moderator}]: {$reason}"
        ]);

        return $developer;
    }
}
