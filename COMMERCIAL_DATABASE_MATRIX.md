# BhoomiOne v2: Commercial Database Matrix

This document maps all database tables supporting BhoomiOne's commercial engine inside PostgreSQL.

| Table Name | Primary Purpose | Key Fields | Relationships |
|------------|-----------------|------------|---------------|
| `subscription_plans` | Base subscription tiers | `id`, `plan_code`, `name`, `monthly_price`, `yearly_price`, `status` | Referenced by plan limits and feature associations. |
| `subscription_plan_limits` | Numerical resource bounds for each tier | `id`, `plan_id`, `limit_key`, `limit_value` | Foreign Key `plan_id` referencing `subscription_plans(id)`. |
| `subscription_plan_features` | Module access matrices per subscription | `id`, `plan_id`, `feature_id` | Foreign Key `plan_id` referencing `subscription_plans(id)`. |
| `subscription_addons` | Extra purchase modules (Features/Capacity/Services) | `id`, `addon_code`, `name`, `category`, `price` | Bound to active tenant subscriptions dynamically. |
| `subscription_plot_slabs` | Reference internal development pricing rules | `id`, `min_plots`, `max_plots`, `price_per_plot` | Independent lookup matrix managed by administrators. |
| `tenant_subscriptions` | Active client subscription bindings | `id`, `tenant_code`, `plan_id`, `status`, `expires_at` | Bound to both `subscription_plans` and workspace tenants. |

## Integrity Guidelines
1. **Never Re-create Tables**: Run standard migrations to alter schemas without executing destructive actions.
2. **UUID Integrity**: Standardize all record primary keys as `UUID` to guarantee secure routing across federated SaaS clusters.
3. **Audit History Preservation**: Soft deletes must be implemented via `deleted_at` timestamp columns for plans and tenant bindings to ensure structural audit trails are kept intact.
