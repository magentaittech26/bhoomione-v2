# BhoomiOne V3 - Project and Layout Foundation Stabilization

This document outlines the stabilized operational foundation, database integrity safeguards, and complete transactional lifecycle of **Projects** and **Layouts** within the BhoomiOne platform.

---

## 1. Relational Integrity Rules & Cascade Protections

Projects and Layouts form the dual-layer backbone of real estate plotting ERP modules. To ensure relational integrity across multi-tenant schemas, the platform enforces strict structural boundary rules:

- **Cascade Purge Rules**:
  - Deleting a parent **Project** recursively cascade-purges all associated child **Layouts** and sub-layer **Plots**.
  - Deleting a parent **Layout** recursively cascade-purges all attached child **Plots**.
  - System prompts and verification handshakes require explicit user confirmation prior to execution to prevent accidental data loss.

- **Status Dependencies**:
  - A layout may only be linked to a project that exists in the database.
  - Linking layouts or plots to an `ARCHIVED` project is restricted.

---

## 2. Complete Lifecycle Flow

```
   [ PLANNING / DRAFT ]
            │
            ├───► [ ACTIVE / APPROVED ] ◄───┐
            │            │                  │
            │            ▼                  │
            └────► [ ARCHIVED ] ────────────┘ (Restore)
                         │
                         ▼
                     [ DELETED ] (Permanent / Cascade Purge)
```

### A. Lifecycle States

1. **PLANNING / DRAFT**: Initial registration of project parameters or layout plan subdivisions. No plot sales are permitted in this state.
2. **ACTIVE / APPROVED**: Project registry is validated. For layout phases, transition to `APPROVED` requires a valid Approval Reference Number and Date. Plot inventories become eligible for booking.
3. **ARCHIVED**: Soft-isolation state. High-level project or layout configurations are put into read-only status.
4. **DELETED**: Full database-level deletion with cascading constraints matching transactional foreign keys.

---

## 3. Stabilization Features

- **Duplicate Name Check**: The system validates name uniqueness within the parent context. A layout phase named "Phase 1" cannot be duplicated within the same Project, but "Phase 1" can exist under separate Projects.
- **Area & Unit Validation**: Layout zoned areas must be positive numeric values higher than 0 and must bind to a validated Master Measurement Unit ID.
- **Audit Trails**: Every state transition (creation, modification, archiving, restoration, and deletion) emits a binary JSONB-backed audit log tracked dynamically inside local schema audit tables.
