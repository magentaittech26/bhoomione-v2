# Project Context

## 1. Executive Summary
BhoomiOne is an enterprise-grade multi-tenant Real Estate Subdivision Management SaaS platform. It bridges the gap between raw engineering drafts (CAD drawings) and commercial sales operations. It enables real estate developers to upload survey layouts (DXF format), parse them into geometric entities, map them to physical plots, calculate pricing based on volumetric and premium variables, execute buyer bookings with secure collections workflows, and overlay layouts on interactive world maps using similarity coordinates projections.

## 2. Standard Tech Stack

BhoomiOne adheres strictly to a robust, decoupled, and secure architecture:

```
+------------------+     (HTTP API / Port 3000)     +--------------------+
|   React 18 SPA   | <============================> |  Laravel 12 API    |
| (Vite / Tailwind)|                                | (PHP 8.2 / FPM)    |
+------------------+                                +--------------------+
                                                              ||
                                                              \/
                                                    +--------------------+
                                                    |     PostgreSQL     |
                                                    |   (UUID/JSONB)     |
                                                    +--------------------+
```

### 2.1 Client Application (React SPA)
* **Framework**: React 18+ powered by Vite.
* **Styling**: Tailwind CSS direct utility classes.
* **Componentry**: Modularized design focusing on density and negative space (no pre-packaged visual frameworks unless requested).
* **Map Rendering**: Multi-vendor map adapters (`GoogleMapsAdapter`, `MapLibreAdapter`, `LeafletAdapter`, `MapTilerAdapter`) encapsulated by an abstract layer.
* **CAD Render Canvas**: Standard HTML Canvas or inline SVG components utilizing programmatic scaling, panning, and interaction coordinates calculations.

### 2.2 Server Application (Laravel API)
* **Framework**: Laravel 12.x running PHP 8.2.
* **Database Driver**: Eloquent ORM using standard PostgreSQL parameters.
* **State Management**: Fully stateless sessions validated via JSON Web Tokens (JWT).
* **Routing**: Grouped routing mapped under standard Laravel routers (`routes/api.php`).
* **SaaS Gating**: Dynamic middleware (`SubscriptionFeatureGate`) utilizing structural features tables (`saas_features`, `subscription_plan_features`, `tenant_feature_overrides`).

### 2.3 Local Development Environment
An Nginx reverse proxy orchestrates path-based routing over Port 3000:
* `/api/*` requests are proxied via FastCGI to the Laravel-FPM container.
* All other requests resolve directly to the static built React assets or the Vite HMR dev server.

---

## 3. Core Database Paradigm
* **Database**: PostgreSQL with UUID primary keys (`gen_random_uuid()`).
* **Tenancy Isolation**: Database columns are mapped with a standard `tenant_id` UUID field. Middlewares dynamically intercept request scopes and inject tenant context parameters, preventing cross-tenant leakage.
* **Cadastral Geometries**: SVG elements, coordinates lists, and vertices datasets are serialized directly into relational `jsonb` structures within PostgreSQL, allowing speedy relational retrieval without heavy GIS overheads.
