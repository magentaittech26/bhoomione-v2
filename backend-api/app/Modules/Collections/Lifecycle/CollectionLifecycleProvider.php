<?php

namespace App\Modules\Collections\Lifecycle;

use App\Core\Lifecycle\Contracts\LifecycleDefinitionInterface;
use App\Core\Lifecycle\Definitions\LifecycleDefinition;
use App\Core\Lifecycle\Definitions\LifecycleState;
use App\Core\Lifecycle\Definitions\LifecycleTransition;
use App\Core\Lifecycle\Enums\StateColorToken;
use App\Core\Lifecycle\Support\LifecycleProvider;

class CollectionLifecycleProvider extends LifecycleProvider
{
    protected string $entityType = 'payment';
    protected string $module = 'Collections';
    protected string $version = '1.0.0';

    public function definition(): LifecycleDefinitionInterface
    {
        if ($this->definition !== null) {
            return $this->definition;
        }

        $states = [
            new LifecycleState([
                'code' => 'INITIATED',
                'name' => 'Initiated',
                'description' => 'Payment receipt entry initiated in gateway or cash counter.',
                'sequence' => 10,
                'initial' => true,
                'color_token' => StateColorToken::NEUTRAL,
            ]),
            new LifecycleState([
                'code' => 'PENDING',
                'name' => 'Pending Verification',
                'description' => 'Cheque/bank transfer receipt pending bank clearance.',
                'sequence' => 20,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'AUTHORIZED',
                'name' => 'Authorized',
                'description' => 'Payment gateway hold authorized.',
                'sequence' => 30,
                'color_token' => StateColorToken::INFORMATIONAL,
            ]),
            new LifecycleState([
                'code' => 'RECEIVED',
                'name' => 'Received',
                'description' => 'Funds settled in developer bank account.',
                'sequence' => 40,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'ALLOCATED',
                'name' => 'Allocated',
                'description' => 'Receipt allocated against specific instalment breakdown.',
                'sequence' => 50,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'POSTED',
                'name' => 'Posted to Ledger',
                'description' => 'Financial transaction posted to immutable general ledger.',
                'sequence' => 60,
                'immutable' => true,
                'color_token' => StateColorToken::POSITIVE,
            ]),
            new LifecycleState([
                'code' => 'FAILED',
                'name' => 'Failed / Bounced',
                'description' => 'Payment failed or cheque bounced.',
                'sequence' => 65,
                'terminal' => true,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'REVERSED',
                'name' => 'Reversed',
                'description' => 'Posted receipt reversed via formal debit note.',
                'sequence' => 70,
                'terminal' => true,
                'color_token' => StateColorToken::NEGATIVE,
            ]),
            new LifecycleState([
                'code' => 'REFUND_PENDING',
                'name' => 'Refund Pending',
                'description' => 'Overpayment/refund request pending disbursement.',
                'sequence' => 75,
                'color_token' => StateColorToken::WARNING,
            ]),
            new LifecycleState([
                'code' => 'REFUNDED',
                'name' => 'Refunded',
                'description' => 'Receipt refunded.',
                'sequence' => 80,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
            new LifecycleState([
                'code' => 'CANCELLED',
                'name' => 'Cancelled',
                'description' => 'Draft payment receipt entry cancelled.',
                'sequence' => 90,
                'terminal' => true,
                'color_token' => StateColorToken::INACTIVE,
            ]),
        ];

        $transitions = [
            new LifecycleTransition([
                'code' => 'collection.initiate',
                'name' => 'Submit Payment',
                'description' => 'Submit payment receipt entry.',
                'from_states' => ['INITIATED'],
                'destination_state' => 'PENDING',
            ]),
            new LifecycleTransition([
                'code' => 'collection.authorize',
                'name' => 'Authorize Gateway Hold',
                'description' => 'Record online payment authorization.',
                'from_states' => ['PENDING'],
                'destination_state' => 'AUTHORIZED',
            ]),
            new LifecycleTransition([
                'code' => 'collection.receive',
                'name' => 'Receive Funds',
                'description' => 'Confirm cleared funds received in bank account.',
                'from_states' => ['PENDING', 'AUTHORIZED'],
                'destination_state' => 'RECEIVED',
                'required_permission' => 'collections.receive',
                'required_business_rules' => ['collection.amount.not_above_outstanding'],
                'financial' => true,
            ]),
            new LifecycleTransition([
                'code' => 'collection.allocate',
                'name' => 'Allocate Receipt',
                'description' => 'Allocate payment against customer invoice items.',
                'from_states' => ['RECEIVED'],
                'destination_state' => 'ALLOCATED',
            ]),
            new LifecycleTransition([
                'code' => 'collection.post',
                'name' => 'Post to Ledger',
                'description' => 'Post allocated receipt permanently to general ledger.',
                'from_states' => ['ALLOCATED'],
                'destination_state' => 'POSTED',
                'required_permission' => 'collections.post',
                'financial' => true,
                'compliance_sensitive' => true,
                'reversible' => true,
                'reversal_transition_code' => 'collection.reverse',
            ]),
            new LifecycleTransition([
                'code' => 'collection.fail',
                'name' => 'Mark Payment Failed',
                'description' => 'Mark cheque bounce or gateway payment failure.',
                'from_states' => ['INITIATED', 'PENDING', 'AUTHORIZED'],
                'destination_state' => 'FAILED',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'collection.reverse',
                'name' => 'Reverse Posted Receipt',
                'description' => 'Reverse posted financial receipt via audit debit note.',
                'from_states' => ['POSTED'],
                'destination_state' => 'REVERSED',
                'required_permission' => 'collections.reverse',
                'requires_reason' => true,
                'financial' => true,
                'compliance_sensitive' => true,
            ]),
            new LifecycleTransition([
                'code' => 'collection.request_refund',
                'name' => 'Request Receipt Refund',
                'description' => 'Request refund on posted collection.',
                'from_states' => ['POSTED'],
                'destination_state' => 'REFUND_PENDING',
                'requires_reason' => true,
            ]),
            new LifecycleTransition([
                'code' => 'collection.refund',
                'name' => 'Disburse Refund',
                'description' => 'Disburse refund payout.',
                'from_states' => ['REFUND_PENDING'],
                'destination_state' => 'REFUNDED',
                'financial' => true,
            ]),
        ];

        $this->definition = new LifecycleDefinition(
            'collection.lifecycle',
            'Collection & Payment Receipt Lifecycle',
            $this->version,
            $states,
            $transitions
        );

        return $this->definition;
    }
}
