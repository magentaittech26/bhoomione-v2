<?php

namespace App\Modules\Layouts\Lifecycle;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Definitions\LifecycleDefinition;
use App\Core\Lifecycle\Definitions\LifecycleState;
use App\Core\Lifecycle\Definitions\LifecycleTransition;
use App\Core\Lifecycle\Enums\StateColorToken;
use App\Core\Lifecycle\Support\LifecycleProvider;

class LayoutLifecycleProvider extends LifecycleProvider
{
    protected string $entityType = 'layout';
    protected string $module = 'Layouts';
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
                'description' => 'Layout definition created.',
                'sequence' => 10,
                'initial' => true,
                'color_token' => StateColorToken::NEUTRAL,
            ]),
            new LifecycleState([
                'code' => 'MAPPING',
                'name' => 'Mapping',
                'description' => 'DXF vector drawing mapping in progress.',
                'sequence' => 20,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'VALIDATION_PENDING',
                'name' => 'Validation Pending',
                'description' => 'Automated CAD and boundary validation in progress.',
                'sequence' => 25,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'UNDER_REVIEW',
                'name' => 'Under Review',
                'description' => 'Layout undergo urban planning and engineering review.',
                'sequence' => 30,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'APPROVED',
                'name' => 'Approved',
                'description' => 'Layout boundary and plot allocations approved.',
                'sequence' => 40,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'PUBLISHED',
                'name' => 'Published',
                'description' => 'Layout published live to interactive plot catalog.',
                'sequence' => 50,
                'immutable' => true,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'SUSPENDED',
                'name' => 'Suspended',
                'description' => 'Layout temporarily suspended from public display.',
                'sequence' => 55,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'SUPERSEDED',
                'name' => 'Superseded',
                'description' => 'Layout replaced by a newer layout revision.',
                'sequence' => 60,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'REJECTED',
                'name' => 'Rejected',
                'description' => 'Layout submission rejected.',
                'sequence' => 65,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'ARCHIVED',
                'name' => 'Archived',
                'description' => 'Layout permanently archived.',
                'sequence' => 70,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
        ];

        $transitions = [
            new LifecycleTransition([
                'code' => 'layout.start_mapping',
                'name' => 'Start Mapping',
                'description' => 'Begin spatial vector mapping.',
                'from_states' => ['DRAFT'],
                'destination_state' => 'MAPPING',
            ]),
            new LifecycleTransition([
                'code' => 'layout.submit_for_validation',
                'name' => 'Submit for Validation',
                'description' => 'Submit layout for automated geometric boundary validation.',
                'from_states' => ['MAPPING'],
                'destination_state' => 'VALIDATION_PENDING',
            ]),
            new LifecycleTransition([
                'code' => 'layout.submit_for_review',
                'name' => 'Submit for Review',
                'description' => 'Submit layout for formal engineering review.',
                'from_states' => ['VALIDATION_PENDING'],
                'destination_state' => 'UNDER_REVIEW',
            ]),
            new LifecycleTransition([
                'code' => 'layout.approve',
                'name' => 'Approve Layout',
                'description' => 'Approve layout boundary polygon.',
                'from_states' => ['UNDER_REVIEW'],
                'destination_state' => 'APPROVED',
                'required_permission' => 'layouts.approve',
                'required_business_rules' => ['layout.approval.boundary_polygon_required'],
            ]),
            new LifecycleTransition([
                'code' => 'layout.reject',
                'name' => 'Reject Layout',
                'description' => 'Reject layout due to geometric or planning defects.',
                'from_states' => ['UNDER_REVIEW'],
                'destination_state' => 'REJECTED',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'layout.revise',
                'name' => 'Revise Layout',
                'description' => 'Re-open rejected layout for mapping revision.',
                'from_states' => ['REJECTED'],
                'destination_state' => 'MAPPING',
            ]),
            new LifecycleTransition([
                'code' => 'layout.publish',
                'name' => 'Publish Layout',
                'description' => 'Publish approved layout live.',
                'from_states' => ['APPROVED'],
                'destination_state' => 'PUBLISHED',
                'required_permission' => 'layouts.publish',
            ]),
            new LifecycleTransition([
                'code' => 'layout.suspend',
                'name' => 'Suspend Layout',
                'description' => 'Suspend published layout temporarily.',
                'from_states' => ['PUBLISHED'],
                'destination_state' => 'SUSPENDED',
                'requires_reason' => true,
                'reversible' => true,
                'reversal_transition_code' => 'layout.resume',
            ]),
            new LifecycleTransition([
                'code' => 'layout.resume',
                'name' => 'Resume Layout',
                'description' => 'Restore suspended layout to published status.',
                'from_states' => ['SUSPENDED'],
                'destination_state' => 'PUBLISHED',
            ]),
            new LifecycleTransition([
                'code' => 'layout.supersede',
                'name' => 'Supersede Layout',
                'description' => 'Mark layout as superseded by a newer revision.',
                'from_states' => ['PUBLISHED'],
                'destination_state' => 'SUPERSEDED',
            ]),
            new LifecycleTransition([
                'code' => 'layout.archive',
                'name' => 'Archive Layout',
                'description' => 'Archive layout.',
                'from_states' => ['SUPERSEDED', 'REJECTED', 'SUSPENDED'],
                'destination_state' => 'ARCHIVED',
            ]),
        ];

        $this->definition = new LifecycleDefinition(
            'layout.lifecycle',
            'Layout Lifecycle',
            $this->version,
            $states,
            $transitions
        );

        return $this->definition;
    }
}
