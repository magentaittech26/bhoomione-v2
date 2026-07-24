# BhoomiOne V3 — Business Rule Interface Specification

## Executive Summary
This document specifies the contracts governing executable business rules in BhoomiOne V3.

---

## 1. `BusinessRuleInterface` Methods

```php
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
```

---

## 2. Rule Metadata Rules
1. **Rule Code**: Must be lowercase dot-notated string (e.g. `plot.booking.status_available`). Must be unique across the entire system.
2. **Severity**:
   - `RuleSeverity::BLOCKING`: Causes operation to fail with HTTP 422.
   - `RuleSeverity::WARNING`: Advisory message; does not block transaction.
   - `RuleSeverity::INFORMATIONAL`: Metrics and logging only.
3. **Overridability**: If `true`, active authorized overrides in `business_rule_overrides` bypass the rule.
