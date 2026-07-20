# BhoomiOne V3 – Master Module Code Standard

All Master Data Management (MDM) modules in the BhoomiOne platform must adhere to the standard directory tree and functional division of concerns detailed in this document. This enforces long-term modularity, simplifies code-generation, and prevents architectural fragmentation.

---

## 1. Directory Tree Structure

Each master module resides in its own isolated subdirectory under `src/modules/masters/` (frontend/shared code) and `server/routes/` or `server/masters/` (backend logic).

```
src/modules/masters/<ModuleName>/
├── module.ts                 # Registry descriptor and module configuration
├── types.ts                  # Shared data interface models
├── contracts.ts              # API request / response signatures
├── repository.ts             # Server-side queries (SQL builders or Drizzle queries)
├── api.ts                    # Backend route-handlers
├── validation.ts             # Validation rules (regex, Zod, numeric bounds)
├── permissions.ts            # RBAC constant declarations
├── hooks/                    # Frontend React state & mutation hooks
│   └── use<ModuleName>.ts
├── services/                 # Frontend client API proxy service
│   └── <ModuleName>Service.ts
├── components/               # Specialized reusable visual components
│   ├── <ModuleName>Console.tsx  # Central admin view (Tables, Cards, Searches)
│   ├── <ModuleName>Modal.tsx    # Record editor form inside an overlay modal
│   └── <ModuleName>Drawer.tsx   # Read-only side drawer displaying audit/meta
└── documentation/            # Specification sheets and local API reference
```

---

## 2. Directory & File Guidelines

### A. Core Module Descriptor (`module.ts`)
The `module.ts` file exports the registry manifest for the module. This enables the core system to register entitlements, toggle active state, and resolve inter-module dependencies.

```typescript
export interface MasterModuleDescriptor {
  code: string;               // e.g. "measurement_units", "road_types"
  name: string;               // e.g. "Measurement Units Master"
  version: string;            // SemVer version string
  dependsOn: string[];        // Array of prerequisite master codes
  saasEntitlementCode: string;// SaaS pricing tier restriction (e.g. "standard_masters")
  icon: string;               // Lucide icon name
  isSystemModule: boolean;    // Protected system-level flag
}
```

### B. Shared Interfaces (`types.ts` & `contracts.ts`)
*   `types.ts` declares the structural representation of the record in the database.
*   `contracts.ts` declares network transmission structures (e.g., query params, paginated JSON body envelopes, search payloads).

### C. Validation Engine (`validation.ts`)
Contains clean, deterministic validation logic that runs on **both** the client and the server before writing to the database:
*   Enforces alphanumeric codes (e.g., matching `/^[A-Z0-9_]{2,20}$/`).
*   Ensures numeric limits (e.g., conversion factors must be positive floats).
*   Guarantees display order limits and string lengths.

### D. Service & React Hook Components
Frontend modules must *never* execute raw `fetch()` or `axios` calls directly from layout components. All queries must flow through the custom hook:
*   The **Service** class manages HTTP requests, caching layers, and local cache invalidation.
*   The **React Hook** provides lightweight reactive states (`loading`, `data`, `error`), along with utility helpers (e.g., `getLabelById`, `convertValue`, `resolveDefault`).

---

## 3. Strict Development Restrictions
1.  **Code Isolation**: A master module must not import non-common components from other master modules. Cross-references must only happen via system-wide API abstractions or shared database keys.
2.  **No Direct Database Imports**: React components are strictly forbidden from knowing the database table structure. All communication must occur through the unified client-side service layer.
3.  **Naming Cases**:
    *   File names must use CamelCase for components (`PlotTypesConsole.tsx`) and lowercase kebab-case for directories.
    *   Types must use PascalCase (`MeasurementUnit`).
    *   API endpoint paths must use lowercase pluralized kebab-case (e.g., `/api/v1/measurement-units`).
