# Feature Registry Architecture & Feature Catalog Cataloging

This document outlines the operational structure, categorization parameters, and full catalog profile of modules and features within BhoomiOne V2.

---

## 1. Feature Catalog Parameters

Each entry inside the Feature Catalog contains rich metadata to allow runtime capabilities validation, upgrade targeting, and custom provisioning logic:

- **Visibility (`visibility`)**:
  - `EXTERNAL`: Publicly viewable and subscribable inside standard plans.
  - `INTERNAL`: Operational administrative features hidden from normal tenant portals.
  - `PRIVATE`: Restricted beta features enabled exclusively on custom enterprise workspaces.
- **Module Types (`type`)**:
  - `CORE`: Essential components available in basic subscriptions.
  - `COMPANION`: Modular plugins providing advanced workflows (e.g. GIS, DXF imports).
  - `SERVICE`: Microservice bridges or background engines (e.g. AI, bulk notification queues).
- **System Markers (`is_system`)**:
  - Protects core system features from accidental administrator disablement or override removal.
- **Version Tracking (`version`)**:
  - Maps module version tags (e.g. `v1.2`, `v2.0-beta`) to ensure feature compatibility before enabling workspace overrides.
- **Dependencies (`dependencies`)**:
  - Stored inside PostgreSQL as JSONB lists. For example, the `GIS_ADVANCED_ANALYSIS` feature requires `['GIS_CORE_VIEW']` to prevent system errors from loading unsupported dashboards.

---

## 2. Standard 23 Seeded Modules & Feature Matrices

BhoomiOne V2 seeds **23 distinct modules** to support comprehensive land surveying, urban planning, legal documentation, and commercial leasing operations:

| Module Code | Module Name | Core Features | Classification |
|---|---|---|---|
| `GIS` | Geographic Information System | Core View, Contour Map, Adv Topology | CORE |
| `CAD_DXF` | CAD DXF Translation Engine | Parse Files, Coordinate Shift, Export Shapefiles | COMPANION |
| `SURVEY` | Ground Land Surveying | Total Station Upload, DGPS Inputs, Traverse Adjust | CORE |
| `LA_ACQ` | Land Acquisition Workflows | Section 4 Gazettes, Award Calc, Displacement Logs | CORE |
| `LUR_PLAN` | Land Use Regulation & Zoning | Zone Compliance Check, Height Restrictions, Deviations | CORE |
| `TEN_ADM` | Tenant Portal Management | Invite users, Activity audit, Workspace settings | CORE |
| `AG_PORT` | Agent Collaboration Hub | Broker Registration, Commission matrix, Referral tracker | CORE |
| `OWN_REG` | Land Ownership Registry | Title Deeds, Partition deeds, Mutual boundary pacts | CORE |
| `VAL_EST` | Property Valuation & Estimator | Circle Rate Lookup, Depreciation Calc, Market Multipliers | CORE |
| `TAX_BIL` | Municipal Taxation & Billing | Property tax gen, Ledger tracker, Payment gateways | CORE |
| `ENC_DET` | Encroachment Detection | AI Satellite check, Legal notice gen, Eviction workflows | SERVICE |
| `DIS_RES` | Land Dispute Resolution | Case Registry, Hearing Calendars, Document evidence | CORE |
| `UTL_MAP` | Infrastructure & Utility Mapping | Sewer Lines, Electric grids, Fiber optic networks | COMPANION |
| `ENV_IA` | Environmental Impact Assessment | Run Assessments, Carbon offsets, Wetland boundary logs | COMPANION |
| `AGR_LSE` | Agricultural Lease Manager | Crop cycles, Revenue-share logs, Water rights allocation | CORE |
| `MIN_ROY` | Mineral & Mining Royalty Tracker | Lease Bounds, Extraction metrics, Bill of Lading | SERVICE |
| `FRT_REG` | Forestry Land Registry | Tree counting AI, Carbon sequestration, Felling permits | COMPANION |
| `COA_ZON` | Coastal Zone Regulations | High Tide Line bounds, Restricted construction buffer | CORE |
| `PLN_APP` | Plot Layout Planner & Approvals | Auto plot divider, Road spacing, Greenery buffer checks | CORE |
| `MKT_PLC` | BhoomiOne Developer Marketplace | Purchase templates, API access keys, Developer sandboxes | SERVICE |
| `BIP_NOT` | Bulk Notifications & Dispatch | WhatsApp dispatch, Email campaigns, SMS boundary alerts | SERVICE |
| `OAU_INT` | Enterprise SSO & SAML | OAuth2 Handshake, Active Directory, MFA Policies | CORE |
| `RTI_APL` | Right-to-Information Cases | Request registry, SLA clock countdown, Response dispatch | CORE |

---

## 3. Granular Feature Schema Mapping

Each module maintains distinct, granular feature records tied to its parent ID:

```
[GIS Module]
  ├── GIS_CORE_VIEW  (Viewer canvas, layers toggling, distance tool)
  ├── GIS_CONTOUR    (Contour line calculations, slopes, elevation)
  └── GIS_ADV_ANALYST(Buffer generation, intersection queries)

[CAD_DXF Module]
  ├── DXF_PARSER     (Reads CAD coordinate geometries from files)
  ├── DXF_GEOSHIFT   (Shifts vector drawings to real-world GIS bounds)
  └── DXF_EXPORT     (Converts CAD nodes directly to ESRI shapefiles)
```

By querying features dynamically from the database, the frontend and API routes are 100% decoupling-safe, avoiding hardcoded flags or manual array mappings.
