# Multi-Tenancy Architecture

BhoomiOne is built from the ground up as a high-density, secure, multi-tenant SaaS platform. It allows multiple real estate development organizations to share the same compute resources and database instance safely without risk of cross-tenant data leakage.

---

## 🏢 Multi-Tenancy Isolation Paradigms

```
                  +--------------------------------+
                  |  Multi-Tenant Domain Ingress   |
                  | (e.g., tenantA.bhoomione.com)  |
                  +--------------------------------+
                                  ||
                                  \/
                  +--------------------------------+
                  |    Nginx Header Appenders      |
                  |     (Injects X-Tenant-ID)      |
                  +--------------------------------+
                                  ||
                                  \/
                  +--------------------------------+
                  |   Laravel Tenant Middleware    |
                  |   (Dynamic Context Resolver)   |
                  +--------------------------------+
                                  ||
                                  \/
                  +--------------------------------+
                  |  PostgreSQL Database Sandboxing|
                  |   (WHERE tenant_id = context)  |
                  +--------------------------------+
```

### 1. Ingress Subdomain Mapping
Each tenant registers a custom workspace code or domain:
* Tenant A: `tenantA.bhoomione.com` or custom `workspace.tenantA.com`
* Tenant B: `tenantB.bhoomione.com`

The Nginx proxy matches incoming host headers, resolves the active workspace code, and passes it to the Laravel API as a custom `X-Tenant-ID` header.

### 2. Request Tenant Context Resolution
The Laravel middleware `TenantContextMiddleware` intercepts the incoming request:
1. It reads the `X-Tenant-ID` header, or falls back to reading the authenticated user's payload JWT claims.
2. It queries the `tenants` table to verify tenant status (`ACTIVE`, `SUSPENDED`).
3. It binds the active tenant instance onto the application request attributes container (`$request->attributes->set('resolvedTenant', $tenant)`).

### 3. Database Logical Sandboxing
Every model in BhoomiOne (Projects, Layouts, Plots, Customers, Bills) includes a `tenant_id` UUID column.
* **Query Scoping**: When executing SQL, controllers append strict filters:
  ```php
  $projects = Project::where('tenant_id', $tenantId)->get();
  ```
* **Join Security**: During complex GIS layouts queries, table joins enforce tenant bounds across all branches to eliminate leakage:
  ```php
  $layout = Layout::join('projects', 'layouts.project_id', '=', 'projects.id')
      ->where('layouts.id', $id)
      ->where('projects.tenant_id', $tenantId)
      ->first();
  ```
