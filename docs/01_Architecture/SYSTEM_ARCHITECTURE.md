# System Architecture & Infrastructure Blueprints

This document outlines the multi-tier runtime architecture, physical network topologies, proxy configurations, and component responsibilities of BhoomiOne.

---

## 🏗️ Multi-Tier Architecture Blueprint

BhoomiOne operates as a high-performance decoupled layout registry. The system relies on a reverse-proxy layer to route public, admin, and transactional API boundaries safely.

```
                  +-----------------------------------+
                  |        Web Browser client         |
                  +-----------------------------------+
                                    ||
                             (Port 3000 / HTTP)
                                    ||
                                    \/
                  +-----------------------------------+
                  |        Nginx Reverse Proxy        |
                  +-----------------------------------+
                     //                           \\
        (Prefix: /api/*)                 (Prefix: Default)
                   //                               \\
                  \/                                 \/
     +--------------------------+       +--------------------------+
     |       Laravel API        |       |    React SPA Assets      |
     | (PHP-FPM Server Engine)  |       |  (Static / Vite Server)  |
     +--------------------------+       +--------------------------+
                  \\                                 //
                   \\                               //
                    \/                             \/
                  +-----------------------------------+
                  |        PostgreSQL Database        |
                  +-----------------------------------+
```

---

## 🛰️ Component Roles and Responsibilities

### 1. React SPA Front-End (Client)
* **Responsibility**: Dynamic cadastral drawing renderings, interactivity management (zoom/pan), dashboard administration, pricing computations, and sales wizard sequences.
* **Technology**: React 18, Vite build tool, Tailwind CSS, Lucide icons, and `MapProviderAbstraction` (custom GIS library).

### 2. Nginx Proxy & Gateway Layer
* **Responsibility**: Port-3000 entry coordinator. It inspects URL prefixes and forwards API requests directly to the Laravel backend via FastCGI wrappers. It serves static HTML elements directly to minimize latency.
* **Technology**: Optimized Nginx staging configs, running inside Cloud Run.

### 3. Laravel API Backend (Core Server)
* **Responsibility**: Single-source of truth for business logic. It handles PostgreSQL database migrations, user authentications, permission evaluations, spatial georeferencing math, and billing gates.
* **Technology**: Laravel 12 on PHP 8.2 with Eloquent.

### 4. Express Dev Proxy (Legacy Coordinator)
* **Responsibility**: Retained solely for development mock checks. It is marked as **deprecated** for core database, billing, or GIS computations. It MUST NOT house production transactional logic.

---

## 🗄️ Physical Database Layer (PostgreSQL)
* **Role**: Primary state repository. 
* **Model**: Single high-availability database cluster, isolated logically per tenant via a UUID database field `tenant_id` on all entities.
* **Geometry Processing**: Coordinates arrays and lines are stored in structured `jsonb` layout elements, optimized for fast JSON parsing on the Laravel API side.
