# BhoomiOne V2 – Master Data Policy

This policy defines the lifecycle, protection rules, and data integrity standards governing the Master Data of the BhoomiOne platform.

---

## 1. What is Master Data?
In BhoomiOne, **Master Data** refers to static or configuration-level records that define the core capabilities, modules, subscription options, and behavior of the system. This includes:
1.  **SaaS Modules & Features** (`saas_modules`, `saas_features`)
2.  **Subscription Plans & Addons** (`subscription_plans`, `subscription_addons`)
3.  **Plan Configurations** (`subscription_plan_limits`, `subscription_plan_features`)
4.  **Platform Settings** (`saas_platform_settings`)

---

## 2. Immutable vs. Mutable Columns

| Column/Attribute Type | Description | Rules & Guidelines |
| :--- | :--- | :--- |
| **Primary Keys (`id`)** | Unique UUID identifier. | **STRICTLY IMMUTABLE.** Once assigned, it must never be modified, regenerated, or replaced. |
| **Business Lookup Keys (`code`, `plan_code`, `setting_key`)** | Unique string code used for application routing and billing checks. | **STRICTLY IMMUTABLE.** The code represents the semantic business identifier. |
| **Relational Foreign Keys (`module_id`, `plan_id`, `feature_id`)** | Integrity links between master tables. | **STRICTLY IMMUTABLE.** Modifying these values risks orphaning records or breaking cascades. |
| **Mutable Values (`name`, `description`, `price`, `status`, `setting_value`)** | Human-readable texts, pricing schedules, or toggles. | **MUTABLE.** These can be freely updated by seeders or admin operations. |

---

## 3. Policy Mandates & Integrity Safeguards

### A. Non-Destructive Operations
*   No database migrations or deployment operations are allowed to truncate, drop, or recreate Master Data tables.
*   Once a module, feature, or plan is published, it remains active. If it is deprecated, its `status` column must be updated to `INACTIVE` or `DEPRECATED` rather than deleted.

### B. Access and Modification Controls
*   Master Data can only be modified programmatically via audited, safe database migrations/seeders, or by a verified platform super-administrator through secure administrator consoles.
*   No customer tenant or standard administrator accounts can write to or modify platform master tables.
