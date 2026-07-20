# BhoomiOne V3 – Master Data Management (MDM) Platform

The **Master Data Management (MDM) Platform** is the standardized foundational architecture of the BhoomiOne platform. It ensures that all administrative parameters (e.g., measurement units, country codes, state specifications, zoning classifications, land usage categories, road standards, and document types) adhere to an identical structure, database interface, authorization scheme, and user-facing experience.

By implementing this architecture, BhoomiOne achieves complete uniformity. New master modules can inherit from this standard with zero redundancy and perfect architectural compliance.

---

## 1. System Architecture Blueprint

The MDM Platform operates on a decoupled full-stack architecture that ties together PostgreSQL schemas, a standard REST API protocol, a common service/react hook provider, and unified UI component standards.

```
       [ Client Side: Multi-Tenant Workspace ]
                         │
                         ▼
        [ React Master UI Console (Shadcn/Tailwind) ]
                         │
                         ▼
       [ Common React Service & Hook (useMaster) ]
                         │
                         ▼
   [ Server Side: API Gateway & REST Controller (/api/v1/master-name) ]
                         │
                         ▼
    [ Service Logic Layer & Dependency Engine Checks ]
                         │
                         ▼
        [ RBAC Guard / Permission Interceptor ]
                         │
                         ▼
   [ PostgreSQL Multi-Tenant Database (Common Schema Rules) ]
```

---

## 2. Platform Core Subsystems

### A. Centralized Master Module Registry
The `ModuleRegistry` controls the availability of Master Modules. Individual masters can be dynamically:
*   Enabled or Disabled per tenant workspace.
*   Assigned to SaaS entitlement packages (e.g., advanced zoning modules are only active in premium plans).
*   Flagged for cross-module dependencies (e.g., the *Villages* master depends on *Taluks*, which depends on *Districts*).

### B. Master Dependency Engine
To prevent database referential integrity violations and logical layout errors, the **Dependency Engine** verifies master record usage before any state mutation.
1.  **Registry Checking**: Prior to deleting or deactivating a record, the engine queries connected operational tables (e.g., projects, layouts, plots, and financial matrices).
2.  **Visual Dependency Summary**: The UI displays a detailed breakdown of where the record is actively referenced.
3.  **Strict Deletion Block**: If active references exist, deletion is completely prevented, and the user is guided to re-assign or archive the referencing entities first.

### C. Default Resolution Engine
Every master leverages a consistent preference-resolution hierarchy to fetch system-wide default settings:
$$\text{Resolved Value} = \text{User Override} \succ \text{Project Default} \succ \text{Tenant Default} \succ \text{System Default}$$

This guarantees that:
*   **System Defaults** are always available as fallback (e.g., "SQFT" for land area).
*   **Tenant Defaults** allow organizations to standardize their geographic operations.
*   **Project Defaults** let individual real estate developments use local regional units (e.g., "Guntas" or "Ankanas" in South India, "Bighas" in North India).
*   **User Preferences** override visual formatting dynamically.

---

## 3. Localization and Global Readiness
The platform is designed for multilingual and regional extensibility. All master tables include structural columns to support translation schemas without modifying database layouts:
*   `localized_name` (JSONB) storing key-value pairs for active languages (e.g., `{"en": "Square Feet", "kn": "ಚದರ ಅಡಿ", "hi": "वर्ग फीट"}`).
*   `localized_description` (JSONB) for descriptions in local dialects.
*   `country_code` & `state_code` columns to scope masters to specific geographic and regulatory domains.

---

## 4. Master Platform Directory Map

Every compliant master module within the BhoomiOne platform must follow this structure:

```
src/modules/masters/<ModuleName>/
├── module.ts             # Registry descriptor and SaaS entitlement mapping
├── types.ts              # TypeScript interfaces inheriting from the Common Database Contract
├── contracts.ts          # Request/response interfaces and JSON API schemas
├── repository.ts         # Data-access methods mapping database tables
├── api.ts                # Express backend routing and route handler logic
├── validation.ts         # Server-side validation constraints (Zod/Joi rules)
├── permissions.ts        # RBAC permissions list definition
├── hooks/                # Frontend React custom state hooks
│   └── use<ModuleName>.ts
├── services/             # Client-side API request proxies
│   └── <ModuleName>Service.ts
├── components/           # UI elements (Consoles, Forms, Dependency Checkers)
│   ├── <ModuleName>Console.tsx
│   ├── <ModuleName>Modal.tsx
│   └── <ModuleName>Drawer.tsx
├── pages/                # Admin page entry points
├── migrations/           # SQL migration files or Drizzle schema definition
├── seeders/              # Master data seed scripts for local & production bootstrap
├── exports/              # CSV and JSON export helper formatters
├── imports/              # CSV and JSON parsing, auditing, and batch-upload routines
├── tests/                # Automated API endpoints and unit validation tests
└── documentation/        # Local README and API documentation files
```

---

## 5. Architectural Standards Index
For detailed technical guidelines, refer to the following specification sheets:
1.  **[MASTER_MODULE_STANDARD.md](./MASTER_MODULE_STANDARD.md)**: Coding, directory, and module standards.
2.  **[MASTER_DATABASE_STANDARD.md](./MASTER_DATABASE_STANDARD.md)**: Standard tables, columns, constraints, and audit fields.
3.  **[MASTER_API_STANDARD.md](./MASTER_API_STANDARD.md)**: Standard REST endpoints, parameters, and payloads.
4.  **[MASTER_RBAC_STANDARD.md](./MASTER_RBAC_STANDARD.md)**: Fine-grained permissions, roles, and security policy.
5.  **[MASTER_UI_STANDARD.md](./MASTER_UI_STANDARD.md)**: Card vs. table layouts, filters, bulk actions, and consistent styling.
6.  **[MASTER_DEPENDENCY_ENGINE.md](./MASTER_DEPENDENCY_ENGINE.md)**: Referential checks, usage lists, and deletion safeguards.
7.  **[MASTER_DEFAULT_RESOLUTION.md](./MASTER_DEFAULT_RESOLUTION.md)**: Preference hierarchy resolution logic and helpers.
8.  **[MASTER_AUDIT_STANDARD.md](./MASTER_AUDIT_STANDARD.md)**: Standardized auditing trails, log models, and tracking fields.
