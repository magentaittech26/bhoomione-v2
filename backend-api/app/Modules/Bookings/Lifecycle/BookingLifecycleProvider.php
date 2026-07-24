<?php

namespace App\Modules\Bookings\Lifecycle;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Definitions\LifecycleDefinition;
use App\Core\Lifecycle\Definitions\LifecycleState;
use App\Core\Lifecycle\Definitions\LifecycleTransition;
use App\Core\Lifecycle\Enums\StateColorToken;
use App\Core\Lifecycle\Support\LifecycleProvider;

class BookingLifecycleProvider extends LifecycleProvider
{
    protected string $entityType = 'booking';
    protected string $module = 'Bookings';
    protected string $version = '1.0.0';

    public function definition(): LifecycleDefinitionInterface
    {
        if ($this->definition !== null) {
            return $this->definition;
        }

        $states = [
            new LifecycleState([
                'code' => 'DRAFT',
                'name' => 'Draft Booking',
                'description' => 'Booking request being prepared by sales agent.',
                'sequence' => 10,
                'initial' => true,
                'color_token' => StateColorToken::NEUTRAL,
            ]),
            new LifecycleState([
                'code' => 'PENDING_APPROVAL',
                'name' => 'Pending Manager Approval',
                'description' => 'Booking submitted for sales manager review.',
                'sequence' => 20,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'APPROVED',
                'name' => 'Approved',
                'description' => 'Booking approved by sales manager.',
                'sequence' => 30,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'PAYMENT_PENDING',
                'name' => 'Deposit Payment Pending',
                'description' => 'Awaiting mandatory deposit payment collection.',
                'sequence' => 35,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'CONFIRMED',
                'name' => 'Confirmed',
                'description' => 'Deposit received and booking confirmed.',
                'sequence' => 40,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'AGREEMENT_PENDING',
                'name' => 'Agreement Pending',
                'description' => 'Sale agreement draft dispatched for customer execution.',
                'sequence' => 45,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'ACTIVE',
                'name' => 'Active',
                'description' => 'Booking active with ongoing payment schedule instalments.',
                'sequence' => 50,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'COMPLETED',
                'name' => 'Completed',
                'description' => 'All instalments settled and plot handed over.',
                'sequence' => 60,
                'terminal' => true,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'CANCELLATION_REQUESTED',
                'name' => 'Cancellation Requested',
                'description' => 'Customer or developer requested booking cancellation.',
                'sequence' => 65,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'CANCELLED',
                'name' => 'Cancelled',
                'description' => 'Booking formally cancelled.',
                'sequence' => 70,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'REFUND_PENDING',
                'name' => 'Refund Pending',
                'description' => 'Cancellation forfeiture calculated; refund pending accounts payout.',
                'sequence' => 75,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'REFUNDED',
                'name' => 'Refunded',
                'description' => 'Refund disbursed to customer.',
                'sequence' => 80,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'EXPIRED',
                'name' => 'Expired',
                'description' => 'Booking expired due to payment window timeout.',
                'sequence' => 85,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'REJECTED',
                'name' => 'Rejected',
                'description' => 'Booking rejected by manager.',
                'sequence' => 90,
                'terminal' => true,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
        ];

        $transitions = [
            new LifecycleTransition([
                'code' => 'booking.submit',
                'name' => 'Submit Booking',
                'description' => 'Submit booking for manager approval.',
                'from_states' => ['DRAFT'],
                'destination_state' => 'PENDING_APPROVAL',
            ]),
            new LifecycleTransition([
                'code' => 'booking.approve',
                'name' => 'Approve Booking',
                'description' => 'Approve customer booking application.',
                'from_states' => ['PENDING_APPROVAL'],
                'destination_state' => 'APPROVED',
                'required_permission' => 'bookings.approve',
            ]),
            new LifecycleTransition([
                'code' => 'booking.reject',
                'name' => 'Reject Booking',
                'description' => 'Reject booking application.',
                'from_states' => ['PENDING_APPROVAL'],
                'destination_state' => 'REJECTED',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'booking.request_payment',
                'name' => 'Request Deposit Payment',
                'description' => 'Move booking to deposit payment pending stage.',
                'from_states' => ['APPROVED'],
                'destination_state' => 'PAYMENT_PENDING',
            ]),
            new LifecycleTransition([
                'code' => 'booking.confirm',
                'name' => 'Confirm Booking',
                'description' => 'Confirm booking upon receiving required deposit.',
                'from_states' => ['PAYMENT_PENDING'],
                'destination_state' => 'CONFIRMED',
                'required_permission' => 'bookings.confirm',
                'required_business_rules' => ['booking.confirmation.minimum_amount_received'],
            ]),
            new LifecycleTransition([
                'code' => 'booking.activate',
                'name' => 'Activate Booking',
                'description' => 'Activate booking and payment schedule.',
                'from_states' => ['CONFIRMED'],
                'destination_state' => 'ACTIVE',
            ]),
            new LifecycleTransition([
                'code' => 'booking.complete',
                'name' => 'Complete Booking',
                'description' => 'Mark booking completed.',
                'from_states' => ['ACTIVE'],
                'destination_state' => 'COMPLETED',
            ]),
            new LifecycleTransition([
                'code' => 'booking.request_cancellation',
                'name' => 'Request Cancellation',
                'description' => 'Request formal booking cancellation.',
                'from_states' => ['APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE'],
                'destination_state' => 'CANCELLATION_REQUESTED',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'booking.cancel',
                'name' => 'Approve Cancellation',
                'description' => 'Confirm booking cancellation.',
                'from_states' => ['CANCELLATION_REQUESTED'],
                'destination_state' => 'CANCELLED',
                'required_permission' => 'bookings.cancel',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'booking.begin_refund',
                'name' => 'Begin Refund Process',
                'description' => 'Initiate accounts refund payout.',
                'from_states' => ['CANCELLED'],
                'destination_state' => 'REFUND_PENDING',
            ]),
            new LifecycleTransition([
                'code' => 'booking.refund',
                'name' => 'Complete Refund',
                'description' => 'Mark refund payment completed.',
                'from_states' => ['REFUND_PENDING'],
                'destination_state' => 'REFUNDED',
            ]),
            new LifecycleTransition([
                'code' => 'booking.expire',
                'name' => 'Expire Booking',
                'description' => 'Expire booking due to payment deadline timeout.',
                'from_states' => ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PENDING'],
                'destination_state' => 'EXPIRED',
                'automatic' => true,
                'system_only' => true,
            ]),
        ];

        $this->definition = new LifecycleDefinition(
            'booking.lifecycle',
            'Booking Lifecycle',
            $this->version,
            $states,
            $transitions
        );

        return $this->definition;
    }
}
