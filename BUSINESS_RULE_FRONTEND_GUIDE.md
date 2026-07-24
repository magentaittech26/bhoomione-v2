# BhoomiOne V3 — Business Rule Frontend Integration Guide

## Executive Summary
Explains how React/TypeScript components interact with the backend Business Rules Engine via advisory prechecks and handle structured 422 error envelopes.

---

## 1. Advisory Precheck Pattern
React components call `precheckBusinessRules(...)` from `/src/lib/businessRules.ts` before presenting confirmation modals.

```typescript
import { precheckBusinessRules, formatRuleFailuresForUi } from '@/lib/businessRules';

async function handleConfirmBooking(bookingId: string) {
  const result = await precheckBusinessRules({
    action: 'booking.confirm',
    entity_type: 'booking',
    entity_id: bookingId,
  });

  const { isBlocked, blockingMessages, remediations } = formatRuleFailuresForUi(result);

  if (isBlocked) {
    showErrorAlert(blockingMessages, remediations);
    return;
  }

  // Proceed with actual form submit
}
```

---

## 2. Mandatory Rules
* Frontend rule prechecks are purely advisory for UX convenience.
* The backend API remains authoritative and re-evaluates all rules during actual execution.
