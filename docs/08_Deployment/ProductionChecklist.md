# Production Readiness Checklist

This document acts as the final gate check verification matrix before any software update merges into the main production branch of BhoomiOne.

---

## 🚦 Pre-Deployment Verification Grid

### 1. Database Operations Checks
* [ ] Database migrations are backwards-compatible (No dropping active columns without multi-stage transition plan).
* [ ] High-precision coordinates columns use strict numeric decimal designations (`DECIMAL(10, 7)` or `DECIMAL(24, 10)`).
* [ ] All newly added indexes are applied to the schema (`idx_*`).

### 2. Multi-Tenant Security Audits
* [ ] Controllers implement strict workspace filters matching dynamic `X-Tenant-ID` header data.
* [ ] JWT signature validation claims are active and validated on every API endpoint route.
* [ ] Cross-tenant API access testing checks assert a proper `404 Not Found` response.

### 3. Commercial Gating Controls
* [ ] Premium endpoint routes are gated by appropriate `SubscriptionFeatureGate` parameters.
* [ ] Frontend components respect feature flags list and gray out or render upgrade indicators for locked options.

### 4. Build Quality Gates
* [ ] Linter tests run successfully with zero syntax, importing, or formatting compile warnings:
  ```bash
  npm run lint
  ```
* [ ] Core compilation and bundle optimization run successfully:
  ```bash
  npm run build
  ```
