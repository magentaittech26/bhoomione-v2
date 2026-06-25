# Tenant Data Isolation & Sandboxing

This document specifies the protocols, query structures, and validation rules governing the isolation of multi-tenant datasets within the shared database schema.

---

## 🛑 Strict Isolation Mandates

1. **Zero Global Queries**: All controller queries targeting database records (except for global system plan metadata) must include an explicit `tenant_id` constraint.
2. **Double Join Verification**: During spatial compilation requests, join boundaries must trace back to the `tenant_id` to prevent malicious URL routing parameters from fetching unauthorized details.
3. **Implicit Controller Resolution**: Controllers must never trust a tenant ID supplied directly in editable PUT/POST JSON bodies. The active tenant ID MUST be resolved exclusively on the server from the authenticated JWT token payload or Nginx gateway header.

---

## 💻 Query Isolation Patterns

### Eloquent Safe Scopes:
All tenant queries within controllers must enforce tenant mappings:

```php
// SAFE: Resolves active workspace dynamically
$tenantId = $this->getTenantId($request);

$layout = Layout::join('projects', 'layouts.project_id', '=', 'projects.id')
    ->where('layouts.id', $id)
    ->where('projects.tenant_id', $tenantId)
    ->select('layouts.*')
    ->first();
```

---

## 🚷 Data Leakage Prevention Audits

* **Automated Middleware Check**: Any backend controller routing must be bounded by the `PermissionRequirementMiddleware` and `TenantContextMiddleware`.
* **Testing Assertions**: Integration tests must execute cross-tenant requests (e.g. attempting to read a Layout using Tenant B's credentials and Tenant A's ID) and assert that a `404 Not Found` or `403 Forbidden` response is returned.
