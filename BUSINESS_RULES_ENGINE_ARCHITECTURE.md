# BhoomiOne V3 — Central Business Rules Engine Architecture

## Executive Summary
The Central Business Rules Engine provides a unified, deterministic, and audited evaluation framework for BhoomiOne V3. It decouples business eligibility policies from HTTP Controllers, Domain Services, Queue Jobs, and Frontend clients.

---

## 1. Architectural Principles
1. **Single Point of Truth**: Business rules execute identical logic regardless of the caller (Web UI, Mobile, REST API, Queue Job, CLI).
2. **Deterministic Execution**: Rules run in dependency and alphabetical order.
3. **Fail-Closed Default**: If an unexpected exception occurs during rule evaluation, the engine registers a BLOCKING failure to prevent unauthorized transactions.
4. **Auditability**: Every enforced evaluation produces an immutable record in `business_rule_evaluations` and `business_rule_evaluation_results`.

---

## 2. Core Architectural Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Caller Context                        │
│ (Controller / Domain Service / Artisan / Queue / API)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BusinessRuleContext (DTO)                   │
│ (Tenant, Actor, Entity, Action, Request Data, Snapshots)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BusinessRuleEngine                       │
│  - Fetches applicable rules from RuleRegistry               │
│  - Evaluates overrides from BusinessRuleOverride            │
│  - Evaluates rules safely (Fail-Closed)                     │
│  - Constructs BusinessRuleEvaluation                        │
│  - Logs via BusinessRuleAuditService                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Pass: Continue Transaction]          [Fail: Throw BusinessRuleException (422)]
```

---

## 3. Separation of Concerns Matrix

| Concern | Responsible Engine | Examples |
|---|---|---|
| **Input Validation** | Laravel Form Requests / Validators | Required fields, numeric range, UUID format |
| **Authorization** | Security & RBAC Policies | Role checks, tenant isolation middleware |
| **Database Integrity** | DB Migrations & FKs | Unique indexes, foreign key constraints |
| **Business Rules** | Central Business Rules Engine | Minimum deposit received, project approval state, plot availability |
| **Workflow Coordination** | Workflow Engine | State transitions calling Business Rules Engine for eligibility |
