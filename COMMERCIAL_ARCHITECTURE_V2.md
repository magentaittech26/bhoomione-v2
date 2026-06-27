# Commercial Engine Architecture V2 – System Design Specification

This document details the unified design, relational integrity model, and override algorithms of the BhoomiOne V2 commercial subscription framework.

---

## 1. Relational Integrity & Schema Model

The commercial engine's architectural goal is to make subscription, module, feature, and limit management **database-driven** and **atomic**. This is achieved by ensuring:

1. **Foreign Key Integrity**: Tables are linked with explicit foreign key constraints (`ON DELETE CASCADE` or `ON DELETE RESTRICT`) to prevent orphaned features or broken mappings.
2. **Atomic Mutations**: Override allocations, plan assignments, and billing customizations use PostgreSQL **Transactions** (`BEGIN`, `COMMIT`, `ROLLBACK`) to enforce consistency.
3. **No Redundancy**: We reuse existing tables and normalize the relationship rather than duplicating product schemas.

---

## 2. Override Compilation Algorithm

When a tenant makes an operational API request inside BhoomiOne V2, the system determines access by running the **SaaS Override Resolve Algorithm** in real-time.

```
       Tenant workspace initializes request
                        │
                        ▼
           Load standard plan baseline
         (subscription_plan_features)
                        │
                        ▼
      APPLY: Module Overrides (tenant_module_overrides)
      [ENABLED: grant module features / DISABLED: revoke module features]
                        │
                        ▼
      APPLY: Feature Overrides (tenant_feature_overrides)
      [ENABLED: force grant / DISABLED: force revoke]
                        │
                        ▼
      APPLY: Addon Assignments (tenant_addons)
      [Grant additional addon features]
                        │
                        ▼
      APPLY: Limit Overrides (tenant_limit_overrides)
      [Raise numerical quota values]
                        │
                        ▼
       Compile Final Runtime Authority Context
```

### Pseudocode for Runtime Flag Resolve:
```typescript
function resolveFeatureAccess(tenantId: string, featureCode: string): boolean {
  // 1. Get current subscription
  const sub = db.query("SELECT * FROM tenant_subscriptions WHERE tenant_id = ?", tenantId);
  if (!sub || sub.status !== "ACTIVE") return false;

  // 2. Load feature metadata
  const feature = db.query("SELECT * FROM saas_features WHERE code = ?", featureCode);
  if (!feature) return false;

  // 3. Check for specific module-level block overrides
  const moduleOverride = db.query(
    "SELECT override_status FROM tenant_module_overrides WHERE tenant_subscription_id = ? AND module_id = ?",
    sub.id, feature.module_id
  );
  if (moduleOverride?.override_status === "DISABLED") return false;

  // 4. Check for explicit feature-level overrides
  const featureOverride = db.query(
    "SELECT override_status FROM tenant_feature_overrides WHERE tenant_subscription_id = ? AND feature_id = ?",
    sub.id, feature.id
  );
  if (featureOverride?.override_status === "ENABLED") return true;
  if (featureOverride?.override_status === "DISABLED") return false;

  // 5. Check if enabled via standard plan
  const planHasFeature = db.query(
    "SELECT 1 FROM subscription_plan_features WHERE plan_id = ? AND feature_id = ?",
    sub.plan_id, feature.id
  );
  if (planHasFeature) return true;

  // 6. Check if enabled via purchased addons
  const addonHasFeature = db.query(
    "SELECT 1 FROM tenant_addons ta JOIN addon_features af ON ta.addon_id = af.addon_id WHERE ta.tenant_subscription_id = ? AND af.feature_id = ?",
    sub.id, feature.id
  );
  if (addonHasFeature) return true;

  return false;
}
```

---

## 3. Custom Contracts & Billing Overrides

To accommodate regional enterprise client requirements, BhoomiOne V2 supports custom contracts and specialized pricing configurations via `tenant_billing_overrides`:

- **Custom Fee Schedules**: Custom monthly or annual fees can override the standard values defined in standard tiers.
- **Custom Discount Metrics**: Supports a percentage value (`custom_discount_percentage`) deducted from standard plan pricing.
- **SLA Agreements & Notes**: A designated `special_contract_notes` column stores custom contract notes, payment conditions, and customized SLA details directly inside PostgreSQL.
- **Audit Logging Integration**: Every change made to overrides triggers an audit trail record mapping the operator's email and details of modified vectors.
