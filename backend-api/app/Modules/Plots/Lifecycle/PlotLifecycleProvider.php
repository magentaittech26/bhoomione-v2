<?php

namespace App\Modules\Plots\Lifecycle;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Definitions\LifecycleDefinition;
use App\Core\Lifecycle\Definitions\LifecycleState;
use App\Core\Lifecycle\Definitions\LifecycleTransition;
use App\Core\Lifecycle\Enums\StateColorToken;
use App\Core\Lifecycle\Support\LifecycleProvider;

class PlotLifecycleProvider extends LifecycleProvider
{
    protected string $entityType = 'plot';
    protected string $module = 'Plots';
    protected string $version = '1.0.0';

    public function definition(): LifecycleDefinitionInterface
    {
        if ($this->definition !== null) {
            return $this->definition;
        }

        $states = [
            new LifecycleState([
                'code' => 'DRAFT',
                'name' => 'Draft Plot',
                'description' => 'Plot details captured, not yet available for hold or sale.',
                'sequence' => 10,
                'initial' => true,
                'color_token' => StateColorToken::NEUTRAL,
            ]),
            new LifecycleState([
                'code' => 'AVAILABLE',
                'name' => 'Available',
                'description' => 'Plot open for holds, reservations, and bookings.',
                'sequence' => 20,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'ON_HOLD',
                'name' => 'On Hold',
                'description' => 'Plot placed under temporary hold reservation.',
                'sequence' => 25,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'RESERVED',
                'name' => 'Reserved',
                'description' => 'Plot reserved pending deposit payment settlement.',
                'sequence' => 30,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'BOOKED',
                'name' => 'Booked',
                'description' => 'Plot confirmed booked by a customer.',
                'sequence' => 40,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'AGREEMENT_PENDING',
                'name' => 'Agreement Pending',
                'description' => 'Formal sale agreement generated and awaiting signatures.',
                'sequence' => 45,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'AGREEMENT_EXECUTED',
                'name' => 'Agreement Executed',
                'description' => 'Sale agreement fully executed by buyer and developer.',
                'sequence' => 50,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'REGISTERED',
                'name' => 'Registered',
                'description' => 'Sub-registrar title registration complete.',
                'sequence' => 60,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'CONSTRUCTION',
                'name' => 'Under Construction',
                'description' => 'Infrastructure or villa construction in progress on plot.',
                'sequence' => 65,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'HANDED_OVER',
                'name' => 'Handed Over',
                'description' => 'Plot possession formally handed over to buyer.',
                'sequence' => 70,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'BLOCKED',
                'name' => 'Blocked',
                'description' => 'Plot blocked from public sale (e.g. legal dispute, mortgage).',
                'sequence' => 75,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'CANCELLED',
                'name' => 'Cancelled',
                'description' => 'Plot record cancelled.',
                'sequence' => 80,
                'terminal' => true,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'MERGED',
                'name' => 'Merged',
                'description' => 'Plot merged into a larger adjacent plot entity.',
                'sequence' => 85,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'SUBDIVIDED',
                'name' => 'Subdivided',
                'description' => 'Plot subdivided into multiple smaller plot entities.',
                'sequence' => 90,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'ARCHIVED',
                'name' => 'Archived',
                'description' => 'Plot record archived.',
                'sequence' => 95,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
        ];

        $transitions = [
            new LifecycleTransition([
                'code' => 'plot.make_available',
                'name' => 'Make Available',
                'description' => 'Open plot for sales inventory.',
                'from_states' => ['DRAFT'],
                'destination_state' => 'AVAILABLE',
            ]),
            new LifecycleTransition([
                'code' => 'plot.place_hold',
                'name' => 'Place Hold',
                'description' => 'Place a temporary hold reservation.',
                'from_states' => ['AVAILABLE'],
                'destination_state' => 'ON_HOLD',
                'requires_reason' => true,
                'reversible' => true,
                'reversal_transition_code' => 'plot.release_hold',
            ]),
            new LifecycleTransition([
                'code' => 'plot.release_hold',
                'name' => 'Release Hold',
                'description' => 'Release hold and return plot to inventory.',
                'from_states' => ['ON_HOLD'],
                'destination_state' => 'AVAILABLE',
            ]),
            new LifecycleTransition([
                'code' => 'plot.reserve',
                'name' => 'Reserve Plot',
                'description' => 'Reserve plot for customer.',
                'from_states' => ['AVAILABLE', 'ON_HOLD'],
                'destination_state' => 'RESERVED',
            ]),
            new LifecycleTransition([
                'code' => 'plot.book',
                'name' => 'Book Plot',
                'description' => 'Confirm booking on available/reserved plot.',
                'from_states' => ['AVAILABLE', 'ON_HOLD', 'RESERVED'],
                'destination_state' => 'BOOKED',
                'required_permission' => 'plots.book',
                'required_business_rules' => ['plot.booking.status_available'],
            ]),
            new LifecycleTransition([
                'code' => 'plot.cancel_booking',
                'name' => 'Cancel Plot Booking',
                'description' => 'Cancel plot booking and restore inventory availability.',
                'from_states' => ['BOOKED'],
                'destination_state' => 'AVAILABLE',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'plot.mark_agreement_pending',
                'name' => 'Mark Agreement Pending',
                'description' => 'Initiate agreement execution stage.',
                'from_states' => ['BOOKED'],
                'destination_state' => 'AGREEMENT_PENDING',
            ]),
            new LifecycleTransition([
                'code' => 'plot.execute_agreement',
                'name' => 'Execute Agreement',
                'description' => 'Record fully executed sale agreement.',
                'from_states' => ['AGREEMENT_PENDING'],
                'destination_state' => 'AGREEMENT_EXECUTED',
            ]),
            new LifecycleTransition([
                'code' => 'plot.register',
                'name' => 'Register Title',
                'description' => 'Record formal title deed registration.',
                'from_states' => ['AGREEMENT_EXECUTED'],
                'destination_state' => 'REGISTERED',
            ]),
            new LifecycleTransition([
                'code' => 'plot.start_construction',
                'name' => 'Start Construction',
                'description' => 'Mark plot under villa/unit construction.',
                'from_states' => ['REGISTERED'],
                'destination_state' => 'CONSTRUCTION',
            ]),
            new LifecycleTransition([
                'code' => 'plot.handover',
                'name' => 'Handover Plot',
                'description' => 'Handover physical possession of plot to customer.',
                'from_states' => ['REGISTERED', 'CONSTRUCTION'],
                'destination_state' => 'HANDED_OVER',
            ]),
            new LifecycleTransition([
                'code' => 'plot.block',
                'name' => 'Block Plot',
                'description' => 'Block plot from sales.',
                'from_states' => ['AVAILABLE', 'ON_HOLD', 'RESERVED'],
                'destination_state' => 'BLOCKED',
                'requires_reason' => true,
                'reversible' => true,
                'reversal_transition_code' => 'plot.unblock',
            ]),
            new LifecycleTransition([
                'code' => 'plot.unblock',
                'name' => 'Unblock Plot',
                'description' => 'Unblock plot and restore availability.',
                'from_states' => ['BLOCKED'],
                'destination_state' => 'AVAILABLE',
            ]),
            new LifecycleTransition([
                'code' => 'plot.merge',
                'name' => 'Merge Plot',
                'description' => 'Mark plot merged.',
                'from_states' => ['AVAILABLE'],
                'destination_state' => 'MERGED',
            ]),
            new LifecycleTransition([
                'code' => 'plot.subdivide',
                'name' => 'Subdivide Plot',
                'description' => 'Mark plot subdivided.',
                'from_states' => ['AVAILABLE'],
                'destination_state' => 'SUBDIVIDED',
            ]),
        ];

        $this->definition = new LifecycleDefinition(
            'plot.lifecycle',
            'Plot Inventory Lifecycle',
            $this->version,
            $states,
            $transitions
        );

        return $this->definition;
    }
}
