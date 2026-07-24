<?php

namespace App\Core\BusinessRules\Contracts;

use App\Core\BusinessRules\Enums\RuleSeverity;

interface BusinessRuleInterface
{
    public function code(): string;
    public function name(): string;
    public function description(): string;
    public function module(): string;
    public function version(): string;
    public function severity(): RuleSeverity;
    public function isOverridable(): bool;
    public function appliesTo(BusinessRuleContextInterface $context): bool;
    public function evaluate(BusinessRuleContextInterface $context): RuleResultInterface;
    public function dependencies(): array;
    public function tags(): array;
}
