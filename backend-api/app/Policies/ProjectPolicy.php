<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Project;

class ProjectPolicy
{
    /**
     * Determine whether the user can publish/unpublish/update SEO of the project.
     */
    public function publish(User $user, Project $project): bool
    {
        return $user->tenant_id === $project->tenant_id;
    }

    /**
     * Determine whether the user can view the project.
     */
    public function view(User $user, Project $project): bool
    {
        return $user->tenant_id === $project->tenant_id;
    }
}
