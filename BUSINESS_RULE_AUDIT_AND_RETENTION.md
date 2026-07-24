# BhoomiOne V3 — Business Rule Audit & Retention Policy

## Executive Summary
Defines the audit recording mechanism, database indexing, and retention schedules for business rule evaluations in BhoomiOne V3.

---

## 1. Audit Storage Tables
1. `business_rule_evaluations`: Parent evaluation record containing action, entity, result counts, execution time, correlation ID, and execution source.
2. `business_rule_evaluation_results`: Child records capturing rule code, version, severity, pass/fail state, evidence JSON, and failed conditions.

---

## 2. Retention Levels
* **Failed / Blocked Evaluations**: Retained for 7 years for compliance and audit trail.
* **Successful Financial / Booking Evaluations**: Retained indefinitely.
* **Informational / Precheck Dry-Runs**: Retained for 90 days.
