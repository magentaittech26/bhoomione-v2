# BhoomiOne Product Constitution

**Version:** 1.0  
**Status:** ACTIVE & BINDING  

This document serves as the absolute product constitution of **BhoomiOne**. It governs the conceptual identity, technical scope, feature priorities, and structural architecture of the platform. All product development, engineering, and design decisions must adhere strictly to these fundamental tenets.

---

## 1. Product Identity

### 1.1 Core Mission
BhoomiOne is a **Map-First Interactive Plot & Layout Management Platform** engineered specifically for real estate developers, land builders, and infrastructure companies. Its primary value is the visual, spatial, and geometric lifecycle management of real estate layouts, plots, roads, and amenities.

### 1.2 Anti-Scope Boundaries (What BhoomiOne Is NOT)
*   **NOT a Generic CRM:** BhoomiOne does not aim to replace general-purpose customer relationship managers. All contact, lead, and ticket operations are strictly anchored to plots, properties, and layouts. We do not build general email marketing suites, general helpdesk modules, or generic customer service features.
*   **NOT a Generic ERP:** BhoomiOne does not provide generic enterprise resource planning features like human resources management, universal payroll, supply chain operations, or corporate ledger structures. All financial workflows are bound to real estate bookings, accounts receivable, and plot transactions.

---

## 2. Core Functional Tenets

### 2.1 The Inventory Management Core
The core representation of physical assets is structured into a frozen, three-tiered hierarchical engine:
$$\text{Project} \longrightarrow \text{Layout} \longrightarrow \text{Plot}$$
*   **Projects:** The high-level real estate master-development context.
*   **Layouts:** The physical tracts of land carved into visual sections, containing roads, amenities, and plot subsets.
*   **Plots:** The individual units of sale, characterized by plot numbers, dimensions, orientation, pricing slabs, and availability status.

This core is **frozen** and cannot be modified or bypassed.

### 2.2 Map-First Interactive Engine
Interactive layout visualization is the primary differentiator of the platform.
*   The system uses high-performance vector representation (SVGs) dynamically rendered from raw engineering geometry coordinates.
*   **Tier-Based Map Unlocking:**
    *   **Starter Plan:** Employs a simplified, high-density **Plot Grid** view. It does not provide access to the Interactive Vector Map.
    *   **Professional Plan:** Unlocks basic interactive vector layouts with standard availability color overlays.
    *   **Enterprise Suite:** Unlocks complete high-fidelity interactive map layers, custom SVG styles, advanced selection tools, and interactive routing overlays.

---

## 3. Product Strategy & Phase Deferrals

### 3.1 Mobile Experience Policy
BhoomiOne is optimized for high-density desktop and tablet screens, which are essential for layout planning and spatial coordinate analysis. A dedicated standalone mobile application is deferred and will be designed later as a specialized companion application. Mobile-responsive layouts on standard web clients must remain clean, but they represent a secondary consumption channel.

### 3.2 Magenta Cloud SSO Integration
Integration with the unified **Magenta Cloud SSO / Central Management** identity platform is officially deferred until the core BhoomiOne product achieves complete structural maturity and production validation. In-app authentication operates autonomously using dedicated tenant isolation.

---

## 4. Technical Architecture Standards

### 4.1 Production Stack
The official production architecture for BhoomiOne remains strictly:
$$\text{React (Vite Frontend)} \longrightarrow \text{Laravel API Service (Backend Router)} \longrightarrow \text{PostgreSQL Database}$$
All commercial operations, compliance audits, accounts receivable, and metadata operations are handled by the robust Laravel engine.

### 4.2 Migration Source of Truth
No manual database modifications are allowed in staging or production. **Laravel migrations are the sole and absolute source of truth** for the production PostgreSQL database schema. No Express-side bootstrap query or DDL command can create or modify tables in production.
