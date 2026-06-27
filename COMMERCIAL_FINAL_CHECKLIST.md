# BhoomiOne V2 Commercial Engine: Final Deployment Checklist

This checklist confirms full compliance with the Phase 1F.13 and Phase 1F.14 architecture and functional requirements.

---

## 1. Scope Boundaries & Architectural Compliance

- [x] **No Express Business Logic**: Verified that the React SPA makes API requests exclusively to the Laravel API backend. The server-side script serves static assets and proxies routes only.
- [x] **No Hardcoding**: Verified that all plans, prices, feature enablement metrics, and limits are requested dynamically from PostgreSQL. No local hardcoded arrays exist for plan configurations.
- [x] **Single-Source of Truth**: Confirmed that the subscription plan is the single commercial product.
- [x] **No Plot Billing Screens**: Confirmed that consumer plot-billing tables are removed from the Subscription Center.
- [x] **Internal Pricing Rules Isolated**: Verified that internal pricing rules remain located under Settings -> Commercial Engine (or SaasSettingsTab), rather than exposed to tenant portals.

---

## 2. Advanced Plan Editor (Control Panel Validation)

- [x] **Consolidated Interface**: General, Pricing, Limits, and Feature tabs are grouped into a single modal.
- [x] **General Tab Elements**: Plan Code, Name, Description, and **Internal Notes (Administrative)** are fully editable and validated.
- [x] **Pricing Tab Elements**: Monthly Price, Yearly Price, **Renewal Behaviour** (`ROLL_OVER` / `SUSPEND` / `CANCEL`), and **Overdue Grace Period (Days)** parameters.
- [x] **Limits Tab Elements**: Input controls for User Limit, Project Limit, Plot Limit, GIS Layout Limit, and File Storage Limit.
- [x] **Features Tab Elements**: Collapsible module groupings with quick-toggle switches linked to the plan feature matrix.

---

## 3. Subscription Center Workspace Tabs

- [x] **1. Plans**: Unified grid layout displaying active subscription plans, limits, prices, and launch controls.
- [x] **2. Add-ons**: Groups and lists add-ons cleanly by Feature, Capacity, or Service categories with clear badge metadata.
- [x] **3. Tenant Licenses**: Expanded table listing active tenant workspaces with Lifespan dates, active Users & Plot consumption, Status, and clickable **Auto-Renew Switches**.
- [x] **4. Usage**: Comprehensive live presentational cluster resource telemetry with fluid utilization bars.
- [x] **5. Invoices**: Financial corporate invoice catalog with printable/actionable listings.
- [x] **6. Audit**: Advanced logs interface supporting real-time keywords search, categories, dates filters, date grouping, and **CSV Sheet Downloads**.

---

## 4. Verification & Compilation Check

- [x] **Linter Execution**: Clean compilation of all files using `npm run lint`.
- [x] **Productive Compilation**: Successful production package build via `npm run build` without any warnings.
- [x] **Decoupled Security**: Critical API keys and environment variables are strictly encapsulated.
