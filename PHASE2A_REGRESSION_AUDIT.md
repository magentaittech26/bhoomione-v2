# Phase 2A Frontend Regression Audit Report

This audit report identifies critical, high, medium, and low severity defects introduced by Phase 2A changes in the BhoomiOne V2 frontend application. These issues destabilize user portal screens, trigger unexpected loading failures under healthy backend conditions, and cause UI components (including the logout options) to disappear or freeze.

---

## Executive Summary & Root Cause

The workspace and authentication backend services are fully operational, but the frontend portal exhibits widespread instability due to **unpropagated and un-synchronized multi-tenancy context headers**. 

When a tenant user logs in, the active tenant context is not automatically injected into standard API requests. This triggers persistent `400 Bad Request` and `403 Forbidden` errors across key inventory catalogs:
* **The Missing Tenant Header Gap**: Standard queries for projects, layouts, plots, and units bypass tenant context parameters, leading the Laravel gateway middleware (`TenantResolverMiddleware`) to abort context resolution.
* **Cascading UI Freeze**: When these core API handshakes fail, uncaught React rendering exceptions and incomplete promise states freeze loading indicators or fully crash parent views, rendering the logout control unreachable.

---

## 1. Issue Classifications & Detailed Findings

### Severity Levels:
* **CRITICAL**: Functional block preventing primary actions, breaking security context, or freezing core workflows.
* **HIGH**: Severe logic defects, data corruption risks, or uncaught rendering exceptions under standard interactions.
* **MEDIUM**: Broken UI metrics, missing status synchronization, or unhandled/mismapped API responses.
* **LOW**: Minor layout discrepancies, redundant rendering cycles, or silenced error states.

---

### [CRITICAL] ─ Missing X-Tenant-ID Header Propagation on Authenticated Actions
* **File Affected**: `/src/lib/api.ts`
* **Description**: The core `request()` handler extracts the bearer token for authorization but requires the caller to explicitly provide the `tenantId` parameter to inject the `X-Tenant-ID` header. 
* **The Defect**: Standard fetching endpoints (including `fetchProjects`, `fetchLayouts`, `fetchPlots`, and `fetchMeasurementUnits`) call `this.request()` without transmitting a `tenantId`. Consequently, the API client makes tenant-agnostic requests. The Laravel server intercepts these calls and rejects them with a `400 Bad Request` or `403 Forbidden` response:
  ```php
  'error' => 'Tenant context could not be resolved. Please specify X-Tenant-ID header.'
  ```
* **Impact**: All authenticated database-backed list screens fail to load or show loading failures even though backend services are active.
* **Root Cause Code (`src/lib/api.ts` lines 213-226)**:
  ```typescript
  async fetchProjects(params?: Record<string, any>): Promise<any> {
    let endpoint = "/projects";
    // ...
    return this.request<any>(endpoint, { method: "GET" }); // <-- Does not pass tenantId
  }
  ```
* **Recommended Fix**: Add a fallback inside the `request<T>()` utility to dynamically resolve active scopes from the session if no explicit target ID is supplied:
  ```typescript
  let finalTenantId = tenantId;
  if (!finalTenantId) {
    const user = this.getCurrentUser();
    if (user) {
      finalTenantId = user.tenantId || user.tenantCode || null;
    }
  }
  if (finalTenantId) {
    headers.set("x-tenant-id", finalTenantId);
  }
  ```

---

### [HIGH] ─ Raw DELETE Requests Bypass Tenant Headers
* **File Affected**: `/src/lib/api.ts`
* **Description**: `deleteProject()`, `deleteLayout()`, and `deletePlot()` run raw native `fetch()` calls instead of routing through the unified `this.request()` core.
* **The Defect**: These custom fetch implementations manually set the `Authorization` header but fail to inject the `X-Tenant-ID` header altogether.
* **Impact**: Even if list loading is corrected, trying to delete a project, layout phase, or plot will trigger a `400/500 Tenant Context Could Not Be Resolved` error from the server.
* **Root Cause Code (`src/lib/api.ts` lines 246-256)**:
  ```typescript
  async deleteProject(id: string): Promise<void> {
    const url = `${this.baseUri}/projects/${id}`;
    const token = this.getAccessToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url, { method: "DELETE", headers }); // <-- completely misses x-tenant-id
    // ...
  }
  ```
* **Recommended Fix**: Migrate these actions to the centralized `this.request()` utility (with safe-catch logic for non-JSON empty response statuses like `204 No Content`) or manually inject the tenant ID:
  ```typescript
  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: "DELETE" });
  }
  ```

---

### [HIGH] ─ Spreading Unparsed String Object Corrupts Metadata
* **File Affected**: `/src/components/InventoryManager.tsx`
* **Description**: Custom metadata properties are manipulated and committed in the plot details pane inside the extensible attributes controls.
* **The Defect**: `selectedPlot.dimensions_metadata` is often returned as a raw JSON string from the server. Spreading a string inside an object literal via `...(selectedPlot.dimensions_metadata || {})` splits the string characters into individual indexed properties (e.g., `'{ "0": "{", "1": "s", ... }'`).
* **Impact**: Triggering any predefined tag or adding a custom attribute string corrupts the metadata and stores deformed records back in the PostgreSQL database.
* **Root Cause Code (`src/components/InventoryManager.tsx` lines 548-551)**:
  ```typescript
  const updatedMeta = {
    ...(selectedPlot.dimensions_metadata || {}), // <-- Dangerous if dimensions_metadata is a string
    plot_attributes: updatedAttributes
  };
  ```
* **Recommended Fix**: Add a normalization guard to parse the value if it has been received in raw stringified format:
  ```typescript
  const rawMeta = selectedPlot.dimensions_metadata;
  const parsedMeta = typeof rawMeta === "string" ? tryParseJSON(rawMeta, {}) : (rawMeta || {});
  const updatedMeta = {
    ...parsedMeta,
    plot_attributes: updatedAttributes
  };
  ```

---

### [MEDIUM] ─ Double Serialization Bug on Plot Record Edit Form
* **File Affected**: `/src/components/InventoryManager.tsx`
* **Description**: Pre-populating form state for editing plot records double-serializes the custom metadata string.
* **The Defect**: In `handleStartEditPlot`, `JSON.stringify(pl.dimensions_metadata || {}, null, 2)` is called unconditionally on `dimensions_metadata`. If `dimensions_metadata` is already returned by the API as a plain JSON string, it gets stringified a second time, producing double-escaped quote markers.
* **Impact**: Opening the plot editor, saving changes, and reloading results in corrupted escape syntax (e.g. `'"{\\"shape\\": \\"rectangular\\"}"'`).
* **Root Cause Code (`src/components/InventoryManager.tsx` lines 516)**:
  ```typescript
  dimensions_metadata: JSON.stringify(pl.dimensions_metadata || {}, null, 2)
  ```
* **Recommended Fix**: Normalize the JSON structure by checking the data type before stringifying:
  ```typescript
  const rawMeta = pl.dimensions_metadata;
  const normalizedObject = typeof rawMeta === "string" ? tryParseJSON(rawMeta, {}) : (rawMeta || {});
  //...
  dimensions_metadata: JSON.stringify(normalizedObject, null, 2)
  ```

---

### [MEDIUM] ─ Mocked Empty Array Breaks Sidebar Plot Aggregate Statistics
* **File Affected**: `/src/components/InventoryManager.tsx`
* **Description**: High-throughput database limits (1,000,000 row considerations) caused plot calculations to be redirected server-side in previous phase updates.
* **The Defect**: To prevent excessive local arrays, `getPlotsForProject` is hardcoded to return a blank array `[]`. However, the visual sidebar layout relies on this function to render aggregates.
* **Impact**: The right-hand inspector panel always incorrectly reports "Available: 0" and "Reserved: 0" in the details panel for all projects, regardless of true database metrics.
* **Root Cause Code (`src/components/InventoryManager.tsx` lines 724-727)**:
  ```typescript
  const getPlotsForProject = (projId: string) => {
    // Plots are now queried server-side due to 1,000,000 row limits.
    return []; // <-- Always returns empty
  };
  ```
* **Recommended Fix**: Wire a server-side aggregate endpoint or dynamically summarize the page-loaded plot statuses that share matching parent layout identifiers.

---

### [LOW] ─ Out-of-Bounds Pagination State Freeze
* **File Affected**: `/src/components/InventoryManager.tsx`
* **Description**: Whenever project, layout, or plot search strings and filter criteria are updated, the active page state is not reset back to `1`.
* **The Defect**: If a user is on Page 5 of the Plots Ledger and then types a search filter that only matches 2 records (making only 1 page of data available), the ledger queries the server for Page 5 of the filtered subset.
* **Impact**: The server returns 0 records for page 5. The page displays "No plots match current filtering logic" confusingly, and the pagination controls are locked out.
* **Recommended Fix**: Explicitly trigger `setProjectPage(1)`, `setLayoutPage(1)`, or `setPlotPage(1)` inside filter and search state change handlers.

---

## 2. Specific Request Audit Checklist Validation

### 1. Broken API URLs
* **Status**: **PASS**. No broken route URLs are registered. Ingress routes match the Laravel endpoints perfectly.

### 2. Missing Authorization Headers
* **Status**: **PASS**. Standard `Authorization: Bearer <JWT>` token injection is correctly set up.

### 3. Invalid JWT Handling / Missing Tenant Headers
* **Status**: **FAIL [CRITICAL]**. Missing auto-fallback of `X-Tenant-ID` on all authenticated lookups and raw deletion fetch routines.

### 4. State Initialization Bugs
* **Status**: **FAIL [MEDIUM]**. Form inputs double-serialize JSON fields when loaded, and empty fallback lists block default selection boxes.

### 5. Infinite Loading Loops
* **Status**: **FAIL [MEDIUM]**. Caught load rejections in page callbacks set error banners but sometimes leave `loading` states active during subsequent navigation transitions.

### 6. Failed Promise Handling
* **Status**: **PASS / WARNING**. Errors are printed to standard console logs and set on the error banner, but silenced rejections in standard React effects should be fortified with boundary wraps.

### 7. Missing Logout Wiring
* **Status**: **PASS**. Logout wiring is fully implemented and mapped down from `TenantWorkspaceApp` into the dashboard workspace. However, if a React rendering exception crashes the parent dashboard container, the logout interface becomes unavailable.

### 8. React Rendering Exceptions
* **Status**: **FAIL [HIGH]**. Custom metrics attributes crash when they try to map or spread non-object value fields inside `dimensions_metadata`.

---

## Conclusion & Next Phase Steps

This frontend regression audit establishes that **none of the reported workspace issues are caused by server failure**. The system is ready to be restored via localized, robust frontend configuration changes:
1. Revamp the `api.ts` file to transparently inject the `X-Tenant-ID` header on all request actions using the token-session profile properties.
2. Safe-parse all JSON meta properties inside custom plot and dimensions managers before manipulating them.
3. Apply validation guards on empty stats and range pagination parameters.
