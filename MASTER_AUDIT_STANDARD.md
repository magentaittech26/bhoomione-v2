# BhoomiOne V3 – Master Audit Standard

Compliance, traceability, and regulatory readiness are core pillars of the BhoomiOne Master Data Management (MDM) platform. This document defines the **Master Audit Standard**, ensuring that every write operation, status toggle, import/export trigger, default resolution change, and dependency violation is recorded in a tamper-resistant audit trail.

---

## 1. Audit Action Catalog

To prevent generic logging, all master-related state mutations must be cataloged using specific, high-fidelity action keys:

| Action Code | Trigger Event | Log Contents / Payload Details |
| :--- | :--- | :--- |
| `MASTER_CREATE` | A new master record is inserted. | Full snapshot of the initial record values. |
| `MASTER_UPDATE` | An existing master record is modified. | Visual Diff of changed fields (`oldValues` vs `newValues`). |
| `MASTER_ACTIVATE` | Record is enabled (`is_active` set to `true`). | Timestamp and initiator details. |
| `MASTER_DEACTIVATE` | Record is disabled (`is_active` set to `false`). | Timestamp and check for active references. |
| `MASTER_DELETE` | Record is soft deleted (`deleted_at` set). | Full snapshot of the archived record. |
| `MASTER_IMPORT` | Bulk creation via CSV or JSON file upload. | File metadata, record count, and success rate. |
| `MASTER_EXPORT` | Bulk records streamed to client file. | Filter parameters used and total rows exported. |
| `MASTER_DEFAULT_CHANGE` | Default value preference is updated. | Origin marker (System, Tenant, or Project update). |
| `MASTER_DEPENDENCY_VIOLATION` | Action is blocked due to active references. | Attempted operation, master ID, and reference count. |

---

## 2. Shared Audit Database Schema

All audit records are written to a centralized, write-once table `audit_logs`. Individual master modules must not maintain isolated audit logs.

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Target Details
    entity_name VARCHAR(100) NOT NULL,          -- e.g. "measurement_units"
    entity_id UUID NOT NULL,                    -- ID of the affected record
    action VARCHAR(100) NOT NULL,               -- e.g. "MASTER_UPDATE"
    
    -- Precise State Snapshots
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    
    -- Client Context
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 3. Server-Side Audit Service Dispatcher

The Express backend routes leverage the unified `AuditLogService` to log operations within active database transactions.

```typescript
// server/services/audit.ts
import { getPool } from "../db/pool.ts";

export interface AuditLogPayload {
  tenantId: string | null;
  userId: string | null;
  entityName: string;
  entityId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  static async log(payload: AuditLogPayload): Promise<void> {
    const db = getPool();
    const query = `
      INSERT INTO audit_logs (
        tenant_id, user_id, entity_name, entity_id, action, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    try {
      await db.query(query, [
        payload.tenantId,
        payload.userId,
        payload.entityName,
        payload.entityId,
        payload.action,
        JSON.stringify(payload.oldValues || {}),
        JSON.stringify(payload.newValues || {}),
        payload.ipAddress || null,
        payload.userAgent || null
      ]);
    } catch (err) {
      console.error("❌ Critical: Failed to write audit log record:", err);
      // In production, dispatch to a persistent dead-letter queue (DLQ)
    }
  }
}
```

---

## 4. UI Compliance Display Standards
Audit logs must be easily audit-verifiable by business compliance officers:
1.  **Tamper-Proof Timestamps**: All logged times must use UTC format on the server, formatted to localized timezone on the client.
2.  **Visual Change Highlighting**: Changed values must be displayed using color-coded diff boxes (e.g. green backgrounds for additions, red for removals) rather than showing a raw JSON dump.
3.  **Searchability**: Administrators must be able to filter the audit log view by user, date range, action type, and specific entity IDs.
