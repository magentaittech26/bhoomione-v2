<?php

namespace App\Modules\Projects\Lifecycle;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Definitions\LifecycleDefinition;
use App\Core\Lifecycle\Definitions\LifecycleState;
use App\Core\Lifecycle\Definitions\LifecycleTransition;
use App\Core\Lifecycle\Enums\StateColorToken;
use App\Core\Lifecycle\Support\LifecycleProvider;

class ProjectLifecycleProvider extends LifecycleProvider
{
    protected string $entityType = 'project';
    protected string $module = 'Projects';
    protected string $version = '1.0.0';

    public function definition(): LifecycleDefinitionInterface
    {
        if ($this->definition !== null) {
            return $this->definition;
        }

        $states = [
            new LifecycleState([
                'code' => 'DRAFT',
                'name' => 'Draft',
                'description' => 'Project setup and initial planning in progress.',
                'sequence' => 10,
                'initial' => true,
                'color_token' => StateColorToken::NEUTRAL,
            ]),
            new LifecycleState([
                'code' => 'UNDER_REVIEW',
                'name' => 'Under Review',
                'description' => 'Project undergoing regulatory and executive management review.',
                'sequence' => 20,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'APPROVED',
                'name' => 'Approved',
                'description' => 'All executive approvals completed. Pending formal activation.',
                'sequence' => 30,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'ACTIVE',
                'name' => 'Active',
                'description' => 'Project actively open for development and inventory bookings.',
                'sequence' => 40,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'ON_HOLD',
                'name' => 'On Hold',
                'description' => 'Project temporarily suspended for administrative or legal reasons.',
                'sequence' => 45,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'COMPLETED',
                'name' => 'Completed',
                'description' => 'All plots sold and handed over. Project fully completed.',
                'sequence' => 50,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'ARCHIVED',
                'name' => 'Archived',
                'description' => 'Historical project record archived.',
                'sequence' => 60,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'CANCELLED',
                'name' => 'Cancelled',
                'description' => 'Project permanently cancelled.',
                'sequence' => 70,
                'terminal' => true,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
        ];

        $transitions = [
            new LifecycleTransition([
                'code' => 'project.submit',
                'name' => 'Submit for Review',
                'description' => 'Submit draft project for review.',
                'from_states' => ['DRAFT'],
                'destination_state' => 'UNDER_REVIEW',
                'required_permission' => 'projects.submit',
            ]),
            new LifecycleTransition([
                'code' => 'project.approve',
                'name' => 'Approve Project',
                'description' => 'Grant formal approval to the project.',
                'from_states' => ['UNDER_REVIEW'],
                'destination_state' => 'APPROVED',
                'required_permission' => 'projects.approve',
            ]),
            new LifecycleTransition([
                'code' => 'project.reject',
                'name' => 'Reject to Draft',
                'description' => 'Reject project back to draft state for revision.',
                'from_states' => ['UNDER_REVIEW'],
                'destination_state' => 'DRAFT',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'project.activate',
                'name' => 'Activate Project',
                'description' => 'Activate project for bookings.',
                'from_states' => ['APPROVED'],
                'destination_state' => 'ACTIVE',
                'required_permission' => 'projects.activate',
                'required_business_rules' => ['project.activation.mandatory_approvals_complete'],
            ]),
            new LifecycleTransition([
                'code' => 'project.place_on_hold',
                'name' => 'Place On Hold',
                'description' => 'Temporarily suspend project activity.',
                'from_states' => ['ACTIVE'],
                'destination_state' => 'ON_HOLD',
                'requires_reason' => true,
                'reversible' => true,
                'reversal_transition_code' => 'project.resume',
            ]),
            new LifecycleTransition([
                'code' => 'project.resume',
                'name' => 'Resume Project',
                'description' => 'Resume active operations for on-hold project.',
                'from_states' => ['ON_HOLD'],
                'destination_state' => 'ACTIVE',
            ]),
            new LifecycleTransition([
                'code' => 'project.complete',
                'name' => 'Mark Completed',
                'description' => 'Mark active project as completed.',
                'from_states' => ['ACTIVE'],
                'destination_state' => 'COMPLETED',
            ]),
            new LifecycleTransition([
                'code' => 'project.archive',
                'name' => 'Archive Project',
                'description' => 'Move completed or cancelled project to archive.',
                'from_states' => ['COMPLETED', 'CANCELLED'],
                'destination_state' => 'ARCHIVED',
            ]),
            new LifecycleTransition([
                'code' => 'project.cancel',
                'name' => 'Cancel Project',
                'description' => 'Permanently cancel project.',
                'from_states' => ['DRAFT', 'UNDER_REVIEW', 'APPROVED'],
                'destination_state' => 'CANCELLED',
                'requires_reason' => true,
                'destructive' => true,
            ]),
        ];

        $this->definition = new LifecycleDefinition(
            'project.lifecycle',
            'Project Lifecycle',
            $this->version,
            $states,
            $transitions
        );

        return $this->definition;
    }
}
