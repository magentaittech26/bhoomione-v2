# BhoomiOne V3 — Business Rule Domain Service Integration Guide

## Executive Summary
This guide specifies the mandatory pattern for integrating the Business Rules Engine inside Domain Services.

---

## 1. Standard Domain Service Pattern

```php
namespace App\Services;

use App\Core\BusinessRules\Context\BusinessRuleContext;
use App\Core\BusinessRules\Contracts\BusinessRuleEngineInterface;

class BookingService
{
    protected BusinessRuleEngineInterface $rulesEngine;

    public function __construct(BusinessRuleEngineInterface $rulesEngine)
    {
        $this->rulesEngine = $rulesEngine;
    }

    public function confirmBooking(string $bookingId, array $data): void
    {
        // 1. Build Context
        $context = BusinessRuleContext::create([
            'tenant_id' => tenant('id'),
            'action' => 'booking.confirm',
            'entity_type' => 'booking',
            'entity_id' => $bookingId,
            'request_data' => $data,
            'entity_snapshot' => $this->getBookingSnapshot($bookingId),
            'execution_source' => 'WEB',
        ]);

        // 2. Enforce Business Rules (Throws BusinessRuleException if blocked)
        $this->rulesEngine->enforce('booking.confirm', $context);

        // 3. Execute DB Transaction
        DB::transaction(function () use ($bookingId, $data) {
            // Update booking status to CONFIRMED
        });
    }
}
```

---

## 2. Integration Rules
1. Controllers MUST NOT evaluate business rules directly; invoke the Domain Service or the precheck endpoint.
2. Domain Services MUST call `$engine->enforce(...)` BEFORE opening the database transaction or inside the transaction prior to mutations.
