# BhoomiOne Enterprise Software Documentation System

Welcome to the central architectural, functional, and operational gateway for **BhoomiOne**, a high-performance CAD and GIS-enabled Multi-Tenant Real Estate Subdivision Management SaaS platform.

This directory houses the structured, compiled documentation, engineering guidelines, API structures, database schemas, and compliance matrices for the BhoomiOne system.

---

## 🗺️ Documentation Directory Map

### 📂 [00_Project](./00_Project) — Project Context & State
* 📘 [PROJECT_CONTEXT.md](./00_Project/PROJECT_CONTEXT.md) — Platform summary, stack definition, and developer setup.
* 👁️ [PROJECT_VISION.md](./00_Project/PROJECT_VISION.md) — Future projections, customer segments, and business goals.
* 🚦 [CURRENT_PHASE.md](./00_Project/CURRENT_PHASE.md) — Tracking of completed, in-progress, pending, and blocked vectors.
* 🛣️ [ROADMAP.md](./00_Project/ROADMAP.md) — Multiphase execution roadmap for BhoomiOne development.
* 📝 [CHANGELOG.md](./00_Project/CHANGELOG.md) — Architectural changelog tracking major structural releases.
* 📊 [MODULE_STATUS.md](./00_Project/MODULE_STATUS.md) — Granular status, ownership, and risk levels for every module.

### 📂 [01_Architecture](./01_Architecture) — System & Engine Blueprints
* 🏗️ [SYSTEM_ARCHITECTURE.md](./01_Architecture/SYSTEM_ARCHITECTURE.md) — Multi-tier design (React SPA → Nginx → Laravel/Express → PostgreSQL).
* 🏢 [MULTITENANCY.md](./01_Architecture/MULTITENANCY.md) — Multi-tenant domain routing, sandboxing, and schema resolution.
* 🛡️ [SECURITY_ARCHITECTURE.md](./01_Architecture/SECURITY_ARCHITECTURE.md) — JWT tokens, cross-origin security, Nginx hardening, and data hashing.
* 🔐 [PERMISSION_MODEL.md](./01_Architecture/PERMISSION_MODEL.md) — RBAC (Role-Based Access Control) permissions, roles, and middleware.
* 💰 [COMMERCIAL_ARCHITECTURE.md](./01_Architecture/COMMERCIAL_ARCHITECTURE.md) — Commercial enforcement gating, plans, overrides, and billing engine.
* 🛰️ [GIS_ARCHITECTURE.md](./01_Architecture/GIS_ARCHITECTURE.md) — Affine Similarity Transformation layer, coordinate projections, and GeoJSON layers.
* 🛒 [MARKETPLACE_ARCHITECTURE.md](./01_Architecture/MARKETPLACE_ARCHITECTURE.md) — Customer bookings portal, downpayments, and public inventory sharing.
* 📱 [MOBILE_ARCHITECTURE.md](./01_Architecture/MOBILE_ARCHITECTURE.md) — Mobile responsive design, touch-friendly grid interactions, and portal adaptors.
* 🤖 [AI_ARCHITECTURE.md](./01_Architecture/AI_ARCHITECTURE.md) — Agent automation rules, prompting systems, and workspace integrations.

### 📂 [02_Database](./02_Database) — Schemas & Tenancy Isolation
* 🗄️ [DATABASE_ARCHITECTURE.md](./02_Database/DATABASE_ARCHITECTURE.md) — PostgreSQL structural parameters, UUID models, and index layouts.
* 🔗 [ENTITY_RELATIONSHIPS.md](./02_Database/ENTITY_RELATIONSHIPS.md) — ER diagrams, table schemas, and foreign keys.
* 🚷 [TENANT_ISOLATION.md](./02_Database/TENANT_ISOLATION.md) — Row-level sandboxing, tenant mapping keys, and data leakage controls.
* 📏 [NAMING_STANDARDS.md](./02_Database/NAMING_STANDARDS.md) — Standards for tables, columns, indexes, foreign keys, and models.

### 📂 [03_Modules](./03_Modules) — Granular Module Manuals
* 📂 [Projects.md](./03_Modules/Projects.md) | [Layouts.md](./03_Modules/Layouts.md) | [Plots.md](./03_Modules/Plots.md) — CAD registry structures.
* 📂 [Customers.md](./03_Modules/Customers.md) | [Bookings.md](./03_Modules/Bookings.md) | [Collections.md](./03_Modules/Collections.md) | [Payments.md](./03_Modules/Payments.md) — Financial workflows.
* 📂 [Documents.md](./03_Modules/Documents.md) | [CRM.md](./03_Modules/CRM.md) | [Inventory.md](./03_Modules/Inventory.md) — Operating parameters.
* 📂 [GIS.md](./03_Modules/GIS.md) | [DXF.md](./03_Modules/DXF.md) | [Marketplace.md](./03_Modules/Marketplace.md) | [Agents.md](./03_Modules/Agents.md) — Technical engines.
* 📂 [CustomerPortal.md](./03_Modules/CustomerPortal.md) | [Reports.md](./03_Modules/Reports.md) | [Analytics.md](./03_Modules/Analytics.md) — Front-facing modules.
* 📂 [Automation.md](./03_Modules/Automation.md) | [CommercialEngine.md](./03_Modules/CommercialEngine.md) — Automation & billing rules.
* 📂 [SubscriptionEngine.md](./03_Modules/SubscriptionEngine.md) | [TenantProvisioning.md](./03_Modules/TenantProvisioning.md) — SaaS system operations.

### 📂 [04_APIs](./04_APIs) — Rest API & Request Specs
* 📑 [API_REFERENCE.md](./04_APIs/API_REFERENCE.md) — Swagger-compliant API overview and headers conventions.
* 🔑 [Authentication.md](./04_APIs/Authentication.md) — JWT login, session refreshes, and auth lifecycle.
* 🛣️ [Endpoints.md](./04_APIs/Endpoints.md) — Detailed specifications of every route (Projects, Layouts, Plots, Billing, etc.).
* 📤 [RequestResponseExamples.md](./04_APIs/RequestResponseExamples.md) — Copy-pasteable payload models for development.
* ⚠️ [ErrorCodes.md](./04_APIs/ErrorCodes.md) — Standardized errors structure (`BAD_REQUEST`, `UNAUTHORIZED`, etc.).

### 📂 [05_Commercial](./05_Commercial) — SaaS Billing & Subscriptions
* 💳 [SubscriptionPlans.md](./05_Commercial/SubscriptionPlans.md) — Standard plans (`Starter`, `Growth`, `Enterprise`) and features.
* 🔌 [Addons.md](./05_Commercial/Addons.md) — Subscription add-ons, pricing slabs, and checkout operations.
* ⚙️ [Overrides.md](./05_Commercial/Overrides.md) — Explicit tenant overrides and system bypass models.
* 🛡️ [RuntimeEnforcement.md](./05_Commercial/RuntimeEnforcement.md) — Dynamic middleware blockades and front-end visibility toggling.
* 📋 [FeatureRegistry.md](./05_Commercial/FeatureRegistry.md) — Code reference of available SaaS feature codes.
* 📊 [Pricing.md](./05_Commercial/Pricing.md) — Interactive pricing calculation sliders and volumetric variables.

### 📂 [06_GIS](./06_GIS) — Projections, CAD, and Maps Engine
* 📐 [DXFEngine.md](./06_GIS/DXFEngine.md) — DXF file parsing, geometry extraction, and layer parsing pipelines.
* 🗺️ [GeoReference.md](./06_GIS/GeoReference.md) — Affine coordinate similarity formulas, mapping local grids to geodetic degrees.
* 🌐 [CoordinateSystem.md](./06_GIS/CoordinateSystem.md) — Projections models, conversion models, and WGS84 standards.
* 📍 [GoogleMaps.md](./06_GIS/GoogleMaps.md) — Map provider adaptation, marker pinning, and boundaries overlay.
* 📐 [GeoJSON.md](./06_GIS/GeoJSON.md) — Compilation specifications, geometry features, and linear ring closure rules.
* 🛰️ [Satellite.md](./06_GIS/Satellite.md) — Remote raster imagery integration, zoom overlays, and layers.
* 🗺️ [MapProviders.md](./06_GIS/MapProviders.md) — Multi-vendor adapters factory (Google, Leaflet, MapLibre, MapTiler).

### 📂 [08_Deployment](./08_Deployment) — Docker, Proxies, and Orchestration
* 📦 [Docker.md](./08_Deployment/Docker.md) — Multi-stage production container profiles and builds.
* 🐘 [LaravelDeployment.md](./08_Deployment/LaravelDeployment.md) — PHP FastCGI execution parameters and Artisan tuning.
* ⚛️ [FrontendDeployment.md](./08_Deployment/FrontendDeployment.md) — Bundled assets routing, static serving, and Vite production configurations.
* 🔄 [Rollback.md](./08_Deployment/Rollback.md) — Fail-safe disaster recovery and rollback procedures.
* 🏁 [ProductionChecklist.md](./08_Deployment/ProductionChecklist.md) — Multi-point production environments readiness validations.

### 📂 [09_Testing](./09_Testing) — Quality Gating & Matrices
* 🧪 [TestingStrategy.md](./09_Testing/TestingStrategy.md) — Automated testing matrix, endpoint validation, and mathematical testing models.
* 🖱️ [ManualQA.md](./09_Testing/ManualQA.md) — Direct UI clicks and flow verification checklists.
* 🛡️ [RegressionChecklist.md](./09_Testing/RegressionChecklist.md) — Regression avoidance criteria during system merges.
* 💨 [SmokeTests.md](./09_Testing/SmokeTests.md) — Post-deployment sanity health check validations.

### 📂 [13_AI](./13_AI) — Prompting & Guardrails
* 📜 [AI_DEVELOPMENT_RULES.md](./13_AI/AI_DEVELOPMENT_RULES.md) — Code formatting mandates, type-safety requirements, and architectural boundaries.
* 📘 [PROMPT_LIBRARY.md](./13_AI/PROMPT_LIBRARY.md) — Pre-calibrated prompts for code refactoring, feature additions, and schema designs.
* 🧱 [ARCHITECTURE_GUARDRAILS.md](./13_AI/ARCHITECTURE_GUARDRAILS.md) — Solid architectural limits preventing anti-patterns.
* 🤝 [AI_SESSION_GUIDE.md](./13_AI/AI_SESSION_GUIDE.md) — Onboarding instructions for every AI agent initiating work on the codebase.

---

## 🔒 Target Architecture Enforcement Directive

BhoomiOne operates strictly under a multi-tier decoupled architecture:
1. **React SPA Client**: Standard TypeScript component libraries styled with Tailwind CSS, strictly consuming structured JSON APIs.
2. **Laravel REST API Backend**: The **only** source of truth for transactional states, SQL migrations, data persistence, multi-tenant sandboxing, security validations, and SaaS billing middleware.
3. **Express Dev Proxy**: Leveraged solely for lightweight development proxying and coordination. It is **strictly prohibited** from managing primary business logic, database migrations, security states, or billing controls.
4. **PostgreSQL Database**: Single robust instance with row-level logical multi-tenant separation.
