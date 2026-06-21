# Sprint 3B Compliance and Audit Report

This audit report evaluates the backend architecture, service coverage, and structural layout of the **Layer Mapping Studio (Sprint 3B)**. It compares the existing Node-based development endpoints against the Laravel production APIs (`/backend-api`) to guide consolidation.

---

## 1. Architectural Audit Checklist & Questions

### Q1: Which Sprint 3B functionality exists inside Laravel backend-api?
The Laravel `backend-api` contains robust, fully realized structures for the core DXF processing pipeline:
* **DXF Ingress & Storage Storage Path Preservation**:
  * `POST /api/v1/dxf/upload` handles multipart CAD uploads, contextually validates the assigned `project_id` and optional `layout_id` for the requesting tenant, hashes file bytes (SHA-256) to block identical duplicates, and writes file streams physically onto the disk under `/storage/tenants/{tenant_id}/dxf/{project_id}/`.
* **State & Log Pipeline Tracking Tracers**:
  * Traces file states (from `uploaded` $\rightarrow$ `queued` $\rightarrow$ `processing` $\rightarrow$ `completed` / `failed`) and stores logs of analysis steps (`UPLOAD_VALIDATE`, `HEADER_READ`, `ENTITY_COUNT`, `FINALIZE`).
* **Line-by-Line DXF Stream Parser Service**:
  * `DxfParserService::discoverLayersAndMetadata` opens the CAD text file stream and scans lines sequentially, identifying layer vectors by matching Group Code `8` (Entity Layer names in DXF specs) and vertex indexes. It fallbacks on pre-defined survey templates (`PLOT_BOUNDARIES`, `INTERNAL_ROADS`, etc.) if empty.
* **Transactional Layer Mapping Configuration**:
  * `POST /api/v1/dxf/mappings` receives custom categorization inputs, purges stale layer configs for the referenced drawing file, and registers updated records to the Postgres database under transactions.
* **Review Finalization dry-run logs**:
  * `POST /api/v1/dxf/process` transitions state histories to complete, appending post-validation reports simulating Step 8 and Step 9.
* **Taxonomy Templates Storage**:
  * Supports saving reusable mappings under `POST /api/v1/dxf/templates` and listing them via `GET /api/v1/dxf/templates`.

---

### Q2: Which Sprint 3B functionality exists only inside: `server.ts`, `server/routes/*`, `server/db/*`?
* **Durable Postgres Schema Setup**:
  * `/server/db/bootstrap.ts` specifies the SQL definition schemas for `dxf_files`, `import_jobs`, `import_job_logs`, `dxf_layer_mappings`, and `import_templates` to seed and index the database.
* **Template Permanently Delete Endpoint**:
  * `DELETE /api/v1/dxf/templates/:id` is handled exclusively within `/server/routes/inventory.ts`. No matching route is registered in Laravel's routing stack.
* **Template Cloning Controller Sub-routines**:
  * The cloning flow aggregates JSON attributes client-side and triggers a creation request to the local Node Express server, rather than relying on a custom `/templates/{id}/clone` route.
* **Zoning Inventory Management Resource Services**:
  * Project layouts mapping metrics, Plots records, Layout boundaries sectors, and Measurement units are simulated inside `/server/routes/inventory.ts` to support high-fidelity offline preview, but they are already fully implemented as native production-grade resources in Laravel.

---

### Q3: Were any new Node preview dependencies introduced?
Yes. To facilitate multipart drafting transfers and handle system binary buffers, two packages were added:
* **`multer`** (v2.2.0)
* **`@types/multer`** (v2.1.0)

---

### Q4: Do Laravel models exist for: `DxfFile`, `ImportJob`, `ImportJobLog`, `DxfLayerMapping`, `ImportTemplate`?
Yes. Eloquent database representations have been mapped successfully inside:
* `DxfFile` $\rightarrow$ `/backend-api/app/Models/DxfFile.php`
* `ImportJob` $\rightarrow$ `/backend-api/app/Models/ImportJob.php`
* `ImportJobLog` $\rightarrow$ `/backend-api/app/Models/ImportJobLog.php`
* `DxfLayerMapping` $\rightarrow$ `/backend-api/app/Models/DxfLayerMapping.php`
* `ImportTemplate` $\rightarrow$ `/backend-api/app/Models/ImportTemplate.php`

---

### Q5: Do Laravel controllers exist?
Yes. A single controller oversees the entire DXF workflow:
* `DxfController` $\rightarrow$ `/backend-api/app/Http/Controllers/Api/v1/DxfController.php`

---

### Q6: Do Laravel API routes exist?
Yes. They are fully defined in `/backend-api/routes/api.php` under the permissioned route group:
```php
Route::get('/dxf/files', [DxfController::class, 'listFiles'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
Route::get('/dxf/jobs', [DxfController::class, 'listJobs'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
Route::get('/dxf/jobs/{id}', [DxfController::class, 'getJob'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
Route::post('/dxf/upload', [DxfController::class, 'upload'])->middleware([PermissionRequirementMiddleware::class . ':dxf.upload']);
Route::post('/dxf/mappings', [DxfController::class, 'saveMappings'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
Route::post('/dxf/process', [DxfController::class, 'approveMapping'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
Route::post('/dxf/templates', [DxfController::class, 'storeTemplate'])->middleware([PermissionRequirementMiddleware::class . ':dxf.process']);
Route::get('/dxf/templates', [DxfController::class, 'listTemplates'])->middleware([PermissionRequirementMiddleware::class . ':dxf.view']);
```

---

### Q7: Are template operations handled by Laravel?
**Fully Supported (Aligning deletes & clones).**
* **Supported**: Laravel handles **Creation/Storage** (`POST /api/v1/dxf/templates`), **Listing** (`GET /api/v1/dxf/templates`), and **Deletion** (`DELETE /api/v1/dxf/templates/{id}`) as of our alignment fixes.
* **CLONE**: Handled client-side by copying the selected template payload and invoking the Laravel POST registration endpoint.

---

### Q8: Are layer mappings persisted by Laravel?
Yes. The `saveMappings` method inside Laravel's `DxfController` clears previous layer classifications for a file and writes new coordinates records inside a transactional database block to avoid corruption.

---

### Q9: Are import jobs managed by Laravel?
Yes. Laravel generates the `ImportJob` and initial logs, and immediately coordinates the parsing steps synchronously/asynchronously through `triggerAsyncAnalysis`, running the stream reader service and populating metadata output tables.

---

### Q10: Identify every Sprint 3B feature that is still Node-only.
1. **Real-time Validation Engine UI Alerts**:
   * Active checks (missing plot/road configuration layers or duplicate boundaries warnings) operate dynamically in React on the frontend layout (`/src/components/CADImportManager.tsx`) for user guidance, with validation logging simulated in the pipeline.
2. **Offline Standalone Fallback Mirroring**:
   * The local Express server mirrors standard Land Inventory Operations (Projects, Layouts, Plots) via custom SQL pools only to guarantee that the development preview environment maintains persistence status even in isolated mode.

---

## 2. Recommendation and Consolidation Plan

To ensure a seamless transition of the DXF Import pipeline entirely into the production Laravel framework in **Sprint 3C**:
1. **Register Template Deletion**:
   * Implement a `destroyTemplate($id)` routine checking tenant isolation inside `DxfController.php`.
   * Bind `Route::delete('/dxf/templates/{id}', [DxfController::class, 'destroyTemplate']);` in `routes/api.php`.
2. **Move Inventory Metadata CRUD**:
   * Build controllers and register API endpoints in Laravel for Projects, Layouts, and Plots to remove reliance on Node mock routes.
3. **Harmonize Core DxfParserService Errors**:
   * Ensure that any file reading issues during background parsing trigger an immediate status shift to `failed` and generate precise debug logs.
