# BhoomiOne V3 — Tenant Isolation Architecture

## 1. Multi-Tenant Perimeter Model
BhoomiOne V3 enforces multi-tenant security boundary isolation at every layer:

1. **Database Schema Level**:
   - Every tenant data table (including `measurement_units`, `projects`, `layouts`, `plots`, `dxf_files`) contains a mandatory `tenant_id` UUID foreign key.
2. **JWT Session Claims**:
   - Access tokens contain the `tenantId` claim.
   - The frontend passes `X-Tenant-ID` header on API requests.
3. **Middleware Perimeter Verification**:
   - `PermissionRequirementMiddleware` extracts `tenantId` from the verified JWT token or `X-Tenant-ID` header.
   - User permissions are evaluated strictly within the context of that `tenantId`.

## 2. Multi-Tenant Role Assignments
A single user identity can belong to multiple tenants with different roles in each tenant:
- Example: User `john@example.com` can be `DEVELOPER_OWNER` in Tenant 1, but `READ_ONLY_USER` in Tenant 2.
- The `tenant_users` composite table (`tenant_id`, `user_id`, `role_id`) maintains isolated role bindings per workspace.
