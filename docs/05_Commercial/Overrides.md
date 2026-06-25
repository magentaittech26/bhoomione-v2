# Commercial Feature Overrides & Bypass Controls

This document specifies the protocols, structures, and tools used by system administrators to define custom feature overrides for individual tenant workspaces.

---

## ⚙️ Overrides Paradigm

To facilitate targeted promotional campaigns, enterprise negotiations, or grace-period billing arrangements, administrators can override subscription restrictions:

* **Explicit Tenant Override table**: `tenant_feature_overrides` holds records linking feature codes (`gis_maps`, `cad_upload`) to explicit state triggers (`ENABLED`, `DISABLED`).
* **Evaluation Precedence**: The `SubscriptionFeatureGate` middleware checks for an active override record FIRST before evaluating standard plan definitions.
* **Safety Rules**: Overrides must be bound by explicit expiration dates (`expires_at`) to prevent perpetual unbilled premium usage.
