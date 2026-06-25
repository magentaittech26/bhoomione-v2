# Platform Roadmap

This document outlines the multi-phase evolutionary roadmap for the BhoomiOne SaaS platform.

---

## 🗺️ Multi-Phase Roadmap

### 📦 Phase 1: Core SaaS Foundation (Completed)
* **Objective**: Build the core SaaS multi-tenant infrastructure, billing engines, and RBAC security systems.
* **Key Achievements**:
  * Formulated tenant sandboxing middleware routing requests dynamically.
  * Engineered a subscription pricing engine with interactive scaling sliders.
  * Designed modular RBAC tree with fine-grained endpoint authorization.
  * Integrated multi-tier tenant dashboards tracking logs.

### 📐 Phase 2: Cadastral CAD & Geometries Extractor (Completed)
* **Objective**: Enable civil layout drawing ingestion and programmatic vector compilations.
* **Key Achievements**:
  * Engineered a three-stage DXF parser resolving blocks, polylines, and circles.
  * Standardized geometry-to-SVG builders transforming raw vectors into high-fidelity drawing elements.
  * Established an interactive layouts canvas handling coordinate zoom, pan, and click events.
  * Created automated plot generation algorithms resolving spatial boundaries.

### 🛰️ Phase 3: real-World GIS & Coordinates Transformation (Current)
* **Objective**: Transition CAD local drawing coordinates into globally georeferenced space.
* **Key Achievements**:
  * Devised conformal similarity transformation mathematics to map Cartesian grids onto WGS84 coordinates.
  * Migrated all coordinates transformations and GeoJSON builders into the **Laravel API**.
  * Gated georeference controls under the premium `gis_maps` subscription feature.
* **Next Steps**:
  * Build the React Map adapter interfaces supporting Google Maps, Leaflet, and MapLibre.
  * Build dynamic layers overlaying CAD grids onto live aerial imagery.

### 🛒 Phase 4: Customer Portals & Bookings Engine (Upcoming)
* **Objective**: Open sales channels to anonymous buyers, handle downpayment workflows, and manage collections.
* **Key Achievements**:
  * Formulating public-sharing tokens for layout lists.
  * Engineering Stripe-based downpayment holds for parcel plots.
  * Designing responsive CRM customer tracking pipelines.

### 🤖 Phase 5: Automated Spatial Appraisals (Future)
* **Objective**: Introduce smart, automated appraisals, and AI-driven land optimization analytics.
* **Key Achievements**:
  * Integrate Gemini-powered text-to-layout search assistants.
  * Programmatic site boundary optimization algorithms maximizing land utilization ratios.
