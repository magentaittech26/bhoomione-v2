# BhoomiOne V3 — Business Rule Context Specification

## Executive Summary
`BusinessRuleContext` is an immutable Data Transfer Object (DTO) capturing the environment, entity snapshots, actor credentials, and request parameters passed to the Business Rules Engine.

---

## 1. Context Structure

```php
$context = BusinessRuleContext::create([
    'tenant_id' => '00000000-0000-0000-0000-000000000001',
    'actor_id' => 'user-uuid',
    'action' => 'plot.book',
    'entity_type' => 'plot',
    'entity_id' => 'plot-uuid',
    'project_id' => 'project-uuid',
    'request_data' => [...],
    'entity_snapshot' => [...],
    'related_entity_snapshots' => [...],
    'execution_source' => 'WEB', // WEB, API, MOBILE, IMPORT, JOB, COMMAND, WORKFLOW, SYSTEM
]);
```

---

## 2. Security & Sanitization
* **Sensitive Payload Filtering**: Passwords, tokens, CVVs, and API keys are automatically redacted (`[REDACTED]`) before context persistence.
* **Correlation Tracing**: Every context automatically receives a unique `correlation_id` (UUID) for distributed log tracking.
