<?php

namespace App\Modules\Maps\Lifecycle;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Definitions\LifecycleDefinition;
use App\Core\Lifecycle\Definitions\LifecycleState;
use App\Core\Lifecycle\Definitions\LifecycleTransition;
use App\Core\Lifecycle\Enums\StateColorToken;
use App\Core\Lifecycle\Support\LifecycleProvider;

class MapVersionLifecycleProvider extends LifecycleProvider
{
    protected string $entityType = 'map_version';
    protected string $module = 'Maps';
    protected string $version = '1.0.0';

    public function definition(): LifecycleDefinitionInterface
    {
        if ($this->definition !== null) {
            return $this->definition;
        }

        $states = [
            new LifecycleState([
                'code' => 'DRAFT',
                'name' => 'Draft Map Version',
                'description' => 'Spatial map asset uploaded.',
                'sequence' => 10,
                'initial' => true,
                'color_token' => StateColorToken::NEUTRAL,
            ]),
            new LifecycleState([
                'code' => 'PROCESSING',
                'name' => 'Processing',
                'description' => 'Raster/vector processing and tiling in progress.',
                'sequence' => 15,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'MAPPING',
                'name' => 'Mapping',
                'description' => 'Georeferencing and plot polygon mapping.',
                'sequence' => 20,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'VALIDATION_FAILED',
                'name' => 'Validation Failed',
                'description' => 'Spatial validation or tile rendering failed.',
                'sequence' => 25,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'VALIDATION_PASSED',
                'name' => 'Validation Passed',
                'description' => 'Spatial integrity check passed.',
                'sequence' => 30,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'UNDER_REVIEW',
                'name' => 'Under Review',
                'description' => 'GIS manager review in progress.',
                'sequence' => 35,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'APPROVED',
                'name' => 'Approved',
                'description' => 'Map version approved for deployment.',
                'sequence' => 40,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'PUBLISHED',
                'name' => 'Published',
                'description' => 'Map version live on interactive canvas.',
                'sequence' => 50,
                'immutable' => true,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'SUSPENDED',
                'name' => 'Suspended',
                'description' => 'Map version suspended.',
                'sequence' => 55,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'SUPERSEDED',
                'name' => 'Superseded',
                'description' => 'Replaced by newer map version.',
                'sequence' => 60,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'ARCHIVED',
                'name' => 'Archived',
                'description' => 'Map version archived.',
                'sequence' => 70,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
        ];

        $transitions = [
            new LifecycleTransition([
                'code' => 'map.upload',
                'name' => 'Upload Map File',
                'description' => 'Initiate processing for uploaded CAD/image file.',
                'from_states' => ['DRAFT'],
                'destination_state' => 'PROCESSING',
            ]),
            new LifecycleTransition([
                'code' => 'map.begin_mapping',
                'name' => 'Begin Interactive Mapping',
                'description' => 'Start interactive mapping on canvas.',
                'from_states' => ['PROCESSING'],
                'destination_state' => 'MAPPING',
                'required_entitlement' => 'maps.clickable',
            ]),
            new LifecycleTransition([
                'code' => 'map.validation_fail',
                'name' => 'Mark Validation Failed',
                'description' => 'Record geometry validation error.',
                'from_states' => ['MAPPING'],
                'destination_state' => 'VALIDATION_FAILED',
            ]),
            new LifecycleTransition([
                'code' => 'map.revise',
                'name' => 'Revise Map',
                'description' => 'Return failed map to mapping.',
                'from_states' => ['VALIDATION_FAILED'],
                'destination_state' => 'MAPPING',
            ]),
            new LifecycleTransition([
                'code' => 'map.validation_pass',
                'name' => 'Pass Validation',
                'description' => 'Mark spatial validation passed.',
                'from_states' => ['MAPPING'],
                'destination_state' => 'VALIDATION_PASSED',
            ]),
            new LifecycleTransition([
                'code' => 'map.submit_for_review',
                'name' => 'Submit for GIS Review',
                'description' => 'Submit map for manager review.',
                'from_states' => ['VALIDATION_PASSED'],
                'destination_state' => 'UNDER_REVIEW',
            ]),
            new LifecycleTransition([
                'code' => 'map.approve',
                'name' => 'Approve Map Version',
                'description' => 'Approve spatial map version.',
                'from_states' => ['UNDER_REVIEW'],
                'destination_state' => 'APPROVED',
                'required_permission' => 'maps.approve',
            ]),
            new LifecycleTransition([
                'code' => 'map.publish',
                'name' => 'Publish Map Version',
                'description' => 'Publish map version live.',
                'from_states' => ['APPROVED'],
                'destination_state' => 'PUBLISHED',
                'required_entitlement' => 'maps.online',
            ]),
            new LifecycleTransition([
                'code' => 'map.suspend',
                'name' => 'Suspend Map Version',
                'description' => 'Suspend published map.',
                'from_states' => ['PUBLISHED'],
                'destination_state' => 'SUSPENDED',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'map.supersede',
                'name' => 'Supersede Map Version',
                'description' => 'Mark version superseded by new release.',
                'from_states' => ['PUBLISHED'],
                'destination_state' => 'SUPERSEDED',
            ]),
            new LifecycleTransition([
                'code' => 'map.archive',
                'name' => 'Archive Map Version',
                'description' => 'Archive map version.',
                'from_states' => ['SUPERSEDED', 'SUSPENDED'],
                'destination_state' => 'ARCHIVED',
            ]),
        ];

        $this->definition = new LifecycleDefinition(
            'map.version.lifecycle',
            'Map Version Lifecycle',
            $this->version,
            $states,
            $transitions
        );

        return $this->definition;
    }
}
