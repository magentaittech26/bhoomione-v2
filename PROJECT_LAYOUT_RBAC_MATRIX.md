# BhoomiOne V3 - Project and Layout RBAC Matrix

This document maps system roles to fine-grained operational permissions for Projects and Layouts, detailing the authorization constraints enforced by the API gateway and the frontend viewport.

---

## 1. Permission Matrix

| Role Authority | Project Create/Update | Project Delete/Archive | Layout Create/Update | Layout Delete/Archive | Overwrite MDM Units |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **DEVELOPER_OWNER** / **ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **DEVELOPER_MANAGER** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **SALES_EXECUTIVE** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **TENANT_OWNER** / **ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **PLATFORM_ADMIN** | ✅ Yes (Bypass) | ✅ Yes (Bypass) | ✅ Yes (Bypass) | ✅ Yes (Bypass) | ✅ Yes |
| **GUEST** / **CUSTOMER** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 2. Granular Permission Definitions

- `projects.create`: Register a new land project catalog entry.
- `projects.update`: Modify general specs, RERA numbers, and metadata of a project.
- `projects.archive`: Toggle active statuses to `ARCHIVED`. Restricts downstream plot pricing updates.
- `projects.delete`: Purge project parameters recursively. Restricted to Owners and Admins due to cascade risks.
- `layouts.create`: Register layout subdivision configurations tied to a parent Project.
- `layouts.update`: Edit total area values, measurement units, or approval numbers.
- `layouts.archive`: Toggle layout states to `ARCHIVED`.
- `layouts.delete`: Cascade delete layouts and all plot nodes under them.
- `masters.measurement_units.manage`: Overwrite or configure local tenant measurement units in MDM.

---

## 3. Enforcement & Verification Rules

1. **Token Claims Inspection**: The backend JWT verification middleware decrypts user sub-claims and parses the active tenant ID and role code.
2. **Path Parameter Safety**: The database query layer enforces automatic tenancy isolation by injecting:
   ```sql
   AND tenant_id = current_tenant_id
   ```
3. **Draft-Only Deletion Warning**: While Owners/Admins have permission to delete, deleting an active or approved phase emits a high-priority browser warning before purging transactional data.
