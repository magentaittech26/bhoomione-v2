# BhoomiOne V3 — Business Rule Manual QA Verification Script

## Executive Summary
Provides a step-by-step QA verification workflow for testing the Central Business Rules Engine.

---

## 1. Test Step 1: Precheck Endpoint with Non-Available Plot
* **Request**: `POST /api/v1/tenant/business-rules/evaluate`
* **Payload**:
```json
{
  "action": "plot.book",
  "entity_type": "plot",
  "entity_id": "plot-001",
  "entity_snapshot": { "status": "BOOKED" }
}
```
* **Expected Result**: HTTP `422 Unprocessable Entity` with `error.code = "BUSINESS_RULE_VIOLATION"` and `blocking_rules[0].rule_code = "plot.booking.status_available"`.

---

## 2. Test Step 2: Precheck Endpoint with Available Plot
* **Payload**:
```json
{
  "action": "plot.book",
  "entity_type": "plot",
  "entity_id": "plot-002",
  "entity_snapshot": { "status": "AVAILABLE" }
}
```
* **Expected Result**: HTTP `200 OK` with `success = true`.
