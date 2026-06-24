# PLAN AND FEATURE-GATING ARCHITECTURE AUDIT REPORT
**BhoomiOne SaaS Platform Administrative Architecture Refactoring Proposal**
*Prepared by BhoomiOne Principal Architecture & Engineering Team*
*Target Milestone: Phase 1F.6*

---

## 1. Executive Summary & Core Objective

The primary commercial objective of **Phase 1F.6** is to transition BhoomiOne from a **plot-centric, variable-billing model** to a modern, value-driven **Plan-Driven Gating Model**. 

Currently, customers and administrative users face a confusing UX where subscription plans and "Plot Billing Slabs" compete for commercial prominence. Under the new architecture, **Subscription Plans** (Starter, Growth, Professional, Enterprise) become the sole, top-level commercial products. **Plot Billing Slabs** will be encapsulated entirely as an internal, backend utility calculation engine used for calculating background billing overrides, rather than being advertised as a front-facing product tier.

### Strict Architectural Commandments
1. **Zero Capability Hardcoding**: The frontend must never write checks like `if (plan === 'STARTER')`. All capability checks must be backed by database-driven **feature keys** and **numeric limits**.
2. **Database-Driven Gating**: Access control for menus, features, buttons, and APIs must read directly from the tenant's evaluated active subscription feature matrix.
3. **Internalized Plot Slabs**: Plot slabs remain strictly for administrative overhead cost calculations and background billing ledger adjustments.
4. **Pristine Separation of Concerns**: Do NOT modify the core GIS engines, DXF parsers, agent portfolios, or existing layout geometries. The refactoring targets the administrative gating layers and UI presentation nodes without altering down-stream geometric engines.

---

## 2. Gating Logic Architecture

Below is the dynamic resolution pathway for evaluating whether a tenant has access to a specific platform capability:

```
[Tenant Ingress Request]
           │
           ▼
┌──────────────────────────────┐
│  Resolve Tenant Subdomain    │ ──► Look up `tenant_subscriptions` table
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Identify Current Active Plan│ ──► Retrieve plan-to-feature baselines
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Check Custom overrides Table │ ──► `tenant_feature_overrides` & `tenant_limit_overrides`
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Combine Plan + Overrides     │ ──► Compute effective Boolean matrix & Numeric boundaries
└──────────┬───────────────────┘
           │
           ▼
   [Is Feature Enabled?]
       ├── YES ──► Render Interface Component / Allow API Route Ingress
       └── NO  ──► Display Upgradable Plan Lock Screen / Return HTTP 403
```

---

## 3. Current State vs. Target State Analysis

### Current State
*   **Decoupled & Localized Plans**: Frontend `SaaSAdminApp.tsx` maintains a static, local React state array for subscription plans with preloaded limits.
*   **Over-Exposed Slabs**: The subscription configuration panel lists "Plot Slabs" as a primary navigational tab, creating customer confusion about whether they are buying a plan or paying per plot.
*   **Implicity-Based Features**: Capabilities like AutoCAD DXF parsers and interactive SVG mapping overlays are rendered based on static plan-code evaluations in the view components instead of checking specific module flags.
*   **Empty Settings/Metadata**: Settings values are localized to frontend contexts, requiring manual database intervention for simple feature toggles.

### Target State
*   **Full Database Authority**: The backend PostgreSQL database is the single source of truth for both structural limits (e.g., maximum user seats, plot limits) and functional permissions.
*   **Administrative Slabs Isolation**: Slabs are removed entirely from the customer-facing interface and kept purely inside an isolated *"Internal Billing Config"* admin section for SaaS administrators.
*   **Granular Gating Matrix**: The system checks permissions for 14 individual feature-flags registry items. Access flows from plans down to components.
*   **Live Metrics Calculations**: Current plan parameters, active features, utilized records, and leftover capacity are computed dynamically by database query engines and served via standard REST endpoints.

---

## 4. Normalized Database Review & Additions

A deep audit of the Laravel migration schema confirmed that our underlying relational database is already robustly structured and perfectly normalized. 

### Audited Schema Verification
The tables currently provisioned inside PostgreSQL include:
*   `saas_modules`: Registers platform service packages (e.g., CRM, DXF, projects).
*   `saas_features`: Holds specific granular keys pointing to parents in `saas_modules`.
*   `subscription_plans`: Holds master plan headers, sorted order, and prices.
*   `subscription_plan_features`: Pivot tracking authorization matrix between plans and features.
*   `subscription_plan_limits`: Stores numeric constraints mapped to specific plans.
*   `tenant_subscriptions`: The active bridge between tenant accounts and plans.
*   `tenant_feature_overrides`: Custom tenant-level permissions that override base plans.
*   `tenant_limit_overrides`: Custom tenant-level numeric limits that override base plans.

### Proposed Database Seeder & Registry Update
To implement Phase 1F.6, we will register 14 specific, standardized feature codes inside `saas_features`. Below is the mapping registry:

| Feature Code | Display Name | Module / Scope | Default Status |
|---|---|---|---|
| `plot_grid_view` | Plot Grid Registry Grid | `PLOTS` | ACTIVE |
| `layout_viewer` | Interactive Layout Maps | `LAYOUTS` | ACTIVE |
| `dxf_import` | AutoCAD Ingestion Parser | `DXF` | ACTIVE |
| `dxf_engine` | Geometric Element Analyzer | `DXF` | ACTIVE |
| `gis_maps` | Advanced GIS Coordinates Mapping | `INTERACTIVE_MAP` | ACTIVE |
| `google_maps_layer` | Street & Vector Base Map | `INTERACTIVE_MAP` | ACTIVE |
| `satellite_view` | Satellite Base Map | `INTERACTIVE_MAP` | ACTIVE |
| `marketplace_publish`| Public Listing Portal | `MARKETPLACE` | ACTIVE |
| `agent_portal` | Broker Commission Area | `AGENT_PORTAL` | ACTIVE |
| `customer_portal` | Consumer Invoicing Dashboard | `CUSTOMER_PORTAL` | ACTIVE |
| `advanced_reports` | Dynamic Operational Reports | `PROJECTS` | ACTIVE |
| `api_access` | REST API Access Tokens | `PROJECTS` | ACTIVE |
| `custom_domain` | SSL Domain Proxy Gateway | `PROJECTS` | ACTIVE |
| `whitelabel` | White-Label Brand Configurations| `PROJECTS` | ACTIVE |

---

## 5. API Endpoint Refactoring Specifications

To eliminate client-side hardcoding, the following REST APIs will be enhanced/introduced:

### A. GET `/api/v1/tenant/subscription-summary`
This endpoint is modified to return dynamic, calculated fields based on live table records:
```json
{
  "tenant_id": "018f6f5b-9bfa-7df0-bf21-998823121511",
  "active_plan_code": "STARTER",
  "active_plan_name": "Starter Plan",
  "limits": {
    "projectsLimit": 1,
    "layoutsLimit": 5,
    "plotsLimit": 150,
    "usersLimit": 3,
    "fileStorageGb": 2,
    "apiRequestsLimit": 1000
  },
  "usages": {
    "projects_count": 1,
    "layouts_count": 2,
    "plots_count": 87,
    "users_count": 2,
    "storage_used_gb": 0.45
  },
  "utilization": {
    "projects": 100.0,
    "layouts": 40.0,
    "plots": 58.0,
    "users": 66.7,
    "storage": 22.5
  },
  "enabled_features": [
    "plot_grid_view",
    "layout_viewer"
  ],
  "remaining_plot_capacity": 63
}
```

### B. POST `/api/v1/admin/plans`
Modified payload parameters inside `SaasController::savePlan` to handle plan limit assignments and checkbox feature matrices together in a single atomic transaction:
```json
{
  "plan_code": "GROWTH",
  "name": "Growth Scale Plan",
  "monthly_price": 25000.00,
  "yearly_price": 250000.00,
  "trial_days": 14,
  "status": "ACTIVE",
  "limits": {
    "projectsLimit": 3,
    "layoutsLimit": 15,
    "plotsLimit": 1000,
    "usersLimit": 10,
    "fileStorageGb": 10
  },
  "features": [
    "plot_grid_view",
    "layout_viewer",
    "dxf_import",
    "dxf_engine"
  ]
}
```

---

## 6. Tiered Customer Experience Specifications

### A. The Starter Experience (Plot Grid Registry Mode)
For tenants on the **Starter Plan** (or custom subscriptions where `gis_maps`, `layout_viewer`, and `satellite_view` are disabled), the standard SVG map rendering and satellite map containers are replaced with a high-fidelity **Dynamic Plot Grid Board**.

```
┌────────────────────────────────────────────────────────┐
│  Layouts > Sector Alpha Plots Registry                  │
├────────────────────────────────────────────────────────┤
│  [Search Plots...]  [Status: All]  [Facing: All]       │
├────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐  │
│  │ Plot No: A-101  │ │ Plot No: A-102  │ │ ...      │  │
│  │ Area: 1200 SqFt │ │ Area: 1500 SqFt │ │          │  │
│  │ Status: BOOKED  │ │ Status: VACANT  │ │          │  │
│  │ Facing: East    │ │ Facing: West    │ │          │  │
│  │ Corner: Yes     │ │ Corner: No      │ │          │  │
│  │ Price: ₹18L     │ │ Price: ₹22.5L   │ │          │  │
│  └─────────────────┘ └─────────────────┘ └──────────┘  │
└────────────────────────────────────────────────────────┘
```

#### Technical Implementation Rules:
*   **Dynamic Source**: Cards must render entirely from live database plots mapped to the tenant's selected project layout (retrieved from `/api/v1/layouts/{id}/plots`).
*   **Render Details**: Each card must dynamically bind and display:
    *   Plot Number (`plot_number`)
    *   Area (`area`)
    *   Status (`status` - e.g., VACANT, BOOKED, BLOCKED)
    *   Facing (`facing` - e.g., North, East, South, West)
    *   Corner Plot Flag (`is_corner_plot` - Boolean check displaying high-contrast tag)
    *   Price (`base_price` formatted using localized `formatCurrency`)
*   **No Maps Fallback**: The client-side router detects missing GIS permissions and seamlessly shifts to the grid interface without throwing JavaScript canvas runtime errors.

### B. The Growth Experience
In addition to the Starter Plot Grid, the **Growth Experience** unlocks:
*   `layout_viewer`: Renders basic vectors and non-GIS layouts.
*   `dxf_import`: Unlocks file upload pipelines for AutoCAD `.dxf` files.
*   `dxf_engine`: Evaluates DXF vectors into database coordinates and scales.

### C. The Professional Experience
Unlocks advanced enterprise capabilities:
*   `gis_maps` & `satellite_view`: Full Google Maps/OpenStreetMap coordinates bindings with visual aerial overlay rendering.
*   `marketplace_publish`: Public catalogs with direct customer search indices.
*   `agent_portal`: External broker sub-consoles and performance ledgers.

---

## 7. UI Refactoring Layouts

### A. Subscription Center Tabs
The customer/admin navigation will be refactored to remove the standalone "Plot Billing Slabs" from front-facing pricing options. Slabs are moved to a small background *"Administrative Overheads Config"* cog. 

**Primary Navigational Tab Order:**
1.  **Plans (Package Manager)**
2.  **Feature Matrix (Gate Mapping)**
3.  **Usage Limits (Numeric Thresholds)**
4.  **Add-ons Catalog (Value Packs)**

---

### B. Advanced Plan Editor Wireframe Layout
Admins can manage both quotas and functional access in one unified panel:

```
┌────────────────────────────────────────────────────────┐
│  Edit Subscription Plan: GROWTH                        │
├────────────────────────────────────────────────────────┤
│  Plan Name: [ Growth Scale Plan                    ]  │
│  Monthly Price (INR): [ 25000 ]  Yearly Price: [ 250K] │
├────────────────────────────────────────────────────────┤
│  PLAN QUOTAS & LIMITS                                  │
│  Max Projects: [ 3  ]   Max Layouts: [ 15 ]            │
│  Max Plots:    [1000]   Max Users:   [ 10 ]            │
│  Cloud Storage: [ 10 ] GB                              │
├────────────────────────────────────────────────────────┤
│  FEATURE ACCESS ENTITLEMENTS                           │
│  [X] plot_grid_view         [ ] gis_maps               │
│  [X] layout_viewer          [ ] satellite_view         │
│  [X] dxf_import             [ ] agent_portal           │
│  [X] dxf_engine             [ ] marketplace_publish    │
└────────────────────────────────────────────────────────┘
```

---

### C. Live SaaS Dashboard Section
A clean visual monitor card will render at the top of the Tenant Workspace detail panel:

```
┌────────────────────────────────────────────────────────┐
│  Active Subscription: Growth Scale Plan (ACTIVE)       │
├────────────────────────────────────────────────────────┤
│  Plots Capacity:  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ 725/1000 (72.5%)│
│  User Quota:      ▓▓▓▓▓░░░░░░░░░░░░░░░ 2/10 (20.0%)    │
├────────────────────────────────────────────────────────┤
│  Enabled Capabilities:                                 │
│  ● Plot Grid  ● Layout Maps  ● DXF Import  ● CAD Engine│
└────────────────────────────────────────────────────────┘
```

---

## 8. Migration & Rollout Plan

To transition current databases smoothly, we propose a two-step migration strategy:

### Step 1: Execute Registry SQL Scripts
```sql
-- Ensure all core feature gates are seeded
INSERT INTO saas_features (id, module_id, code, name, group, description, status, default_enabled, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    m.id,
    'layout_viewer',
    'Interactive Layout Maps',
    'Core Development',
    'Renders architectural vector blueprints',
    'ACTIVE',
    true,
    now(),
    now()
FROM saas_modules m WHERE m.code = 'LAYOUTS'
ON CONFLICT (code) DO NOTHING;
```

### Step 2: Plan Feature Association
Associate seeded features to current active plans dynamically inside a customized migration class or Laravel Seeder sequence, preventing active workspace disconnects.

---

## 9. Roadmap Validation & Verification Alignment

| Phase | Milestone Name | Primary Verification Steps | Expected Outcomes |
|---|---|---|---|
| **Phase 1** | Feature Catalog Seeding | Run `php artisan db:seed --class=SaasSubscriptionSeeder` | Database feature matrices are populated cleanly without errors. |
| **Phase 2** | API Middleware Gating | Access layout endpoints with a Starter workspace token | Ingress returns HTTP 403 or redirects to Grid fallback payload. |
| **Phase 3** | Plot Grid UI Deployment | Open Plot Grid under a Starter account | High fidelity card spreadsheet displays perfectly. |
| **Phase 4** | Platform Admin Verification | Compile using `npm run build` & run `npm run lint` | Code builds cleanly with no TypeScript type failures. |

---
*Report concludes. Ready to transition into Phase 1F.6 implementation upon architectural review approval.*
