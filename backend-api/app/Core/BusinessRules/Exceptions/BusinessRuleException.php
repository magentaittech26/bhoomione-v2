<?php

namespace App\Core\BusinessRules\Exceptions;

use App\Core\BusinessRules\Results\BusinessRuleEvaluation;
use Exception;

class BusinessRuleException extends Exception
{
    protected BusinessRuleEvaluation $evaluation;

    public function __construct(BusinessRuleEvaluation $evaluation)
    {
        $this->evaluation = $evaluation;
        $firstFailure = $evaluation->firstBlockingFailure();
        $message = $firstFailure ? $firstFailure->getMessage() : 'The operation is blocked by business rules.';
        
        parent::__construct($message, 422);
    }

    public function getEvaluation(): BusinessRuleEvaluation
    {
        return $this->evaluation;
    }
}
