# Plan Editor & Commercial Engine: Database Schema Mapping

This document provides a technical dictionary mapping the UI components, forms, and variables in the BhoomiOne V2 React SPA to the backend Laravel API models and PostgreSQL database schemas.

---

## 1. Subscription Plans (`saas_plans` / `plans` Table)

The subscription plans represent the primary commercial products of the SaaS ecosystem.

| UI Section / Field | React State / Variable Name | Laravel API Attribute / JSON Key | PostgreSQL Database Column & Type |
| :--- | :--- | :--- | :--- |
| **Plan Name** | `plan.name` | `name` | `VARCHAR(255) NOT NULL` |
| **Description** | `plan.description` | `description` | `TEXT NULL` |
| **Code / Unique ID** | `plan.id` / `plan.code` | `id` / `code` | `UUID PRIMARY KEY` / `VARCHAR` |
| **Monthly Price (₹)** | `plan.monthly_price` | `monthly_price` | `DECIMAL(10, 2) DEFAULT 0.00` |
| **Yearly Price (₹)** | `plan.yearly_price` | `yearly_price` | `DECIMAL(10, 2) DEFAULT 0.00` |
| **Internal Notes** | `plan.internalNotes` | `internal_notes` | `TEXT NULL` |
| **Renewal Behaviour** | `plan.renewalBehavior` | `renewal_behavior` | `VARCHAR(50) DEFAULT 'ROLL_OVER'` |
| **Overdue Grace Period**| `plan.gracePeriodDays` | `grace_period_days` | `INTEGER DEFAULT 7` |
| **Status (Active/Draft)** | `plan.status` | `status` | `VARCHAR(50) DEFAULT 'DRAFT'` |

---

## 2. Resource & Capacity Limits (`saas_plan_limits` Table)

Resource quotas are linked directly to subscription plans in a 1-to-1 or 1-to-many lookup table.

| UI Form Field (Limits Tab) | React Limit Key | Laravel API Key | PostgreSQL Database Column / Limit Key |
| :--- | :--- | :--- | :--- |
| **User Quota Limit** | `users` | `limits.users` | `limit_value` where `limit_key = 'users'` |
| **Project Workspace Limit**| `projects` | `limits.projects` | `limit_value` where `limit_key = 'projects'` |
| **Plot Quota Limit** | `plots` | `limits.plots` | `limit_value` where `limit_key = 'plots'` |
| **GIS Layout Template Limit**| `layouts` | `limits.layouts` | `limit_value` where `limit_key = 'layouts'` |
| **S3 Storage Capacity (GB)** | `storage` | `limits.storage` | `limit_value` where `limit_key = 'storage'` |

---

## 3. Feature Enablement Matrix (`saas_plan_features` Table)

Features are bound to plans through a relational pivot table or JSON enablement matrix.

| UI Component / Toggle | SaaS Module Name | Feature Code | PostgreSQL Mapping |
| :--- | :--- | :--- | :--- |
| **GIS Workspace Access** | `GIS Engine` | `gis_workspace` | Bound in `saas_plan_features` (Plan UUID, Feature Code) |
| **Plot CAD Translator** | `CAD Tools` | `cad_translator` | Bound in `saas_plan_features` (Plan UUID, Feature Code) |
| **Multi-Tenant Routing** | `Tenant Control` | `tenant_routing` | Bound in `saas_plan_features` (Plan UUID, Feature Code) |
| **SLA Dedicated Support** | `Support Service` | `support_sla` | Bound in `saas_plan_features` (Plan UUID, Feature Code) |

---

## 4. Tenant Subscription State (`tenant_subscriptions` / `tenants` Tables)

Active tenant licensing fields are retrieved and managed in the Tenant Licenses tab.

| UI Table Column | React Property Path | Laravel API Mapping | PostgreSQL Column Reference |
| :--- | :--- | :--- | :--- |
| **Tenant workspace** | `t.company_name` | `tenant.company_name` | `tenants.company_name` |
| **Subdomain prefix** | `t.tenant_code` | `tenant.tenant_code` | `tenants.tenant_code` |
| **Active Plan Name** | `t.subscription.plan_name` | `subscription.plan_name` | `saas_plans.name` |
| **Start Date** | `t.subscription.start_date` | `subscription.start_date` | `tenant_subscriptions.start_date` |
| **End Date** | `t.subscription.expiry_date`| `subscription.expiry_date` | `tenant_subscriptions.expiry_date` |
| **Auto-Renew Switch** | `t.subscription.auto_renew` | `subscription.auto_renew` | `tenant_subscriptions.auto_renew` (BOOLEAN) |
| **Active Users Count** | `t.usage.users` | `usage.users` | Calculated dynamic user count |
| **Active Plot Count** | `t.usage.plots` | `usage.plots` | Calculated dynamic plot count |
| **Tenant Status Badge** | `t.subscription.status` | `subscription.status` | `tenant_subscriptions.status` |

---

## 5. Audit & Telemetry Streams (`saas_audit_logs` Table)

Security events, logins, plan modifications, and administrative updates write to a central ledger.

| UI List Element | AuditLog Interface | API JSON Attribute | PostgreSQL Audit Column |
| :--- | :--- | :--- | :--- |
| **Event Identifier** | `l.id` | `id` | `UUID PRIMARY KEY` |
| **Timestamp** | `l.timestamp` | `timestamp` | `TIMESTAMP WITH TIME ZONE` |
| **Action Identifier** | `l.action` | `action` | `VARCHAR(100)` |
| **System Operator** | `l.operator` | `operator` | `VARCHAR(255) (e.g., Email)` |
| **Target Workspace** | `l.target` | `target` | `VARCHAR(255)` |
| **Event Details** | `l.details` | `details` | `TEXT` |
| **Category Badge** | `l.category` | `category` | Evaluated based on action prefix |
| **Severity Badge** | `l.severity` | `severity` | Evaluated based on action prefix |
| **Payload Delta** | `l.old_values` / `l.new_values` | `old_values` / `` | `JSONB` for deep payload inspection |
