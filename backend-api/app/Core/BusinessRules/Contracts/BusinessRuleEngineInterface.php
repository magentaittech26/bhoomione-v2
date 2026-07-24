<?php

namespace App\Core\BusinessRules\Contracts;

use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Results\BusinessRuleEvaluation;

interface BusinessRuleEngineInterface
{
    public function evaluate(string $action, BusinessRuleContext $context): BusinessRuleEvaluation;
    public function evaluateRules(array $ruleCodes, BusinessRuleContext $context): BusinessRuleEvaluation;
    public function enforce(string $action, BusinessRuleContext $context): BusinessRuleEvaluation;
    public function enforceRules(array $ruleCodes, BusinessRuleContext $context): BusinessRuleEvaluation;
    public function explain(string $action, BusinessRuleContext $context): BusinessRuleEvaluation;
}
