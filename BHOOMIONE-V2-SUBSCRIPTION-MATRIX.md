# BHOOMIONE V2: SUBSCRIPTION PLAN FEATURE MATRIX & COMERCIAL MAP RULES
**Document ID**: BHOOMIONE-V2-SUBSCRIPTION-MATRIX  
**Status**: Signed & Locked  
**Version**: 2.0  
**Authority**: Lead Product Owner & Monetization Architect  
**Date**: June 19, 2026  

---

## 1. Commercial Feature Flags Configuration Matrix

To maximize SaaS recurring revenue and scale our platform from independent layout promoters to massive enterprise infrastructure developers, our connection routes, modules, and API gates query **billing feature flags** resolved directly from the tenant's current active subscription state. 

| Subscription Billing Flag | Starter Plan | Growth Plan | Professional Plan | Enterprise Plan |
| :--- | :--- | :--- | :--- | :--- |
| **`feature_maps_basic`** | — *Disabled* (Grid/Tabular View only) | **Included by Default** (Simple layout viewer) | **Included by Default** | **Included by Default** |
| **`feature_maps_advanced`** | — *Disabled* | Paid Add-on | **Included by Default** (Interactive vector clicks, pan/zoom) | **Included by Default** |
| **`feature_cad_import`** | — *Disabled* (No CAD/DXF/SVG imports) | Paid Add-on | **Included by Default** (Background worker queues) | **Included by Default** |
| **`feature_offline_maps`** | — *Disabled* | — *Disabled* | Paid Add-on | **Included by Default** (SQLite spatial caches) |
| **`feature_developer_kyc`**| **Mandatory** | **Mandatory** | **Mandatory** | **Mandatory** |
| **`feature_agent_kyc`** | **Mandatory** | **Mandatory** | **Mandatory** | **Mandatory** |
| **`feature_customer_kyc`** | **Mandatory** | **Mandatory** | **Mandatory** | **Mandatory** |

---

## 2. Plan-Specific Capabilities & Access Controls

### 2.1 Starter Plan: Simple Modular Grid & Plot Blocks
The default, cost-efficient, entry-level SaaS subscription designed for rapid developer onboarding.
*   **Infrastructure Layout Option**: Logical database multi-tenancy on shared cloud cluster files.
*   **Inventory Interface Constraints**:
    *   **No Clickable Geospatial Map**: Full SVG/DXF canvas interactive UI displays are completely hidden.
    *   **Plot Grid & List Layout Only**: Inventory is shown purely as a clean, responsive, status-colored tabular blocks grid (resembling modular layout lists).
    *   **Configurable Plot Fields**: Show plot number, area, facing, road width, base price, and current status flags.
    *   **Core Booking Operations**: Basic form-based reservations, customer registration, metadata verification, and KYC upload triggers.
*   **GIS Access**: All CAD layout file parsing pipelines, layer mapping panels, and SVG renderer routes are fully disabled.

### 2.2 Growth Plan: Interactive Layouts & Custom Schema Separation
The premium balance for scaling real estate layouts.
*   **Infrastructure Layout Option**: Logical schema separation mapping custom schema prefixes (`tenant_tenant_uuid`) within PostgreSQL.
*   **Inventory Interface Capabilities**:
    *   **Basic Interactive SVG Layout**: Dynamic vector plot layout rendering with basic pan and zoom functionality.
    *   **Visual Status Indicators**: Clickable plot layers that update green/yellow/red instantly based on backend events.
    *   **Paid Maps Add-ons available**: Can unlock the background DXF engine and full custom layers without moving to the Professional tier.

### 2.3 Professional Plan: Advanced CAD Import & Agent Field Maps
Designed for large-scale plotted developers with active partner sales networks.
*   **Infrastructure Layout Option**: Shared PostgreSQL cluster with dedicated, metadata-scoping pool instances.
*   **Inventory Interface Capabilities**:
    *   **Core DXF AutoCAD Parsing Engine**: Background file analyzer that extracts closed polylines, centroids, boundaries, and measurements.
    *   **Advanced GIS Overlay Toolkit**: Allows mapping of park assets, schools, metro connections, and relative road centerlines.
    *   **Mobile-Ready Agent Integration**: Advanced map-based booking and territory assignment tools natively enabled.

### 2.4 Enterprise Plan: Private Infrastructure & Dedicated Maps Engine
The top-tier licensing contract for town designers and master developers.
*   **Infrastructure Layout Option**: Dedicated physical standard PostgreSQL containers, customized white-labeling layers, and optional remote VPS deployment setups.
*   **Inventory Interface Capabilities**:
    *   **Full GIS Engine with Mapbox/Google Maps integration**: Direct polygon projection over geographic coordinate spaces and physical satellite imagery.
    *   **Resilient Offline GIS Mode**: Pre-cached Map assets and SQLite synchronization rules for rural, disconnected, and remote sites.
    *   **Custom SLA Support**: Direct access to raw database replicas, custom CRM integration triggers, and dedicated backup storage.

---

## 3. Dynamic API & UI Access Enforcement Architecture

```
                  [ API Request Ingress Gateway ]
                                  │
                       Resolve Tenant Context
                                  │
             Query Tenant Active Billing Feature Flags (Redis)
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
  Flag Resolved: True                                Flag Resolved: False
         ▼                                                 ▼
[ Executed Action Route ]                          [ Action Aborted ]
Renders Interactive SVG Map                        - UI hides map canvas
Allows DXF CAD Imports                            - Shows tabular block lists
Saves Offline Sync Caches                          - Exception: Standard Grid Only
```

### Access Control Rules:
1.  **Handshake Inspection**: Every front-end compilation or user logging request queries active metadata flags. If a Starter plan API attempt calls `/api/v1/gis/process`, the platform throws an immediate `403 FORBIDDEN: MAPS_MODULE_LOCKED` exception.
2.  **Graceful Degenerations**: Frontends share a common repository logic but render conditionally. If `feature_maps_basic` returns false, the layout components gracefully collapse the Canvas stage and fall back automatically to the standard Plot Grid Table view.
3.  **Strict Isolation for Mobile**: Agent PWAs and remote tools query tenant feature-flag metrics. Starter plan agents query only simple textual data streams, minimizing data transmission over slow Rural cellular networks.

---

**End of Document**
