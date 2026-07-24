# BhoomiOne V3 — Business Rule Result Standard

## Executive Summary
This document defines the standardized `RuleResult` value object and `BusinessRuleEvaluation` envelope emitted by the Business Rules Engine.

---

## 1. `RuleResult` Value Object
Every individual rule evaluation produces a `RuleResult` containing:
- `rule_code`: string
- `rule_version`: string
- `passed`: boolean
- `severity`: BLOCKING | WARNING | INFORMATIONAL
- `message`: string
- `user_message`: string
- `error_code`: string
- `remediation`: string
- `evidence`: array
- `failed_conditions`: array
- `execution_time_ms`: float

---

## 2. API Response Envelope

```json
{
  "success": false,
  "message": "The requested operation is blocked by business rules.",
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "evaluation_id": "eval-uuid",
    "action": "plot.book",
    "entity_type": "plot",
    "entity_id": "plot-123",
    "blocking_rules": [
      {
        "rule_code": "plot.booking.status_available",
        "rule_version": "1.0.0",
        "message": "This plot cannot be booked because its current status is BOOKED.",
        "error_code": "PLOT_NOT_AVAILABLE",
        "remediation": "Select an available plot or release active hold."
      }
    ],
    "warnings": []
  },
  "correlation_id": "corr-uuid"
}
```
