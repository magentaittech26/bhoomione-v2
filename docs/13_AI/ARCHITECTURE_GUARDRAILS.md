# Architectural Code Guardrails

This document outlines structural limits preventing code degradation, design conflicts, or security anti-patterns in the BhoomiOne codebase.

---

## 🧱 Architectural Safety Rules

### 1. No Business Logic in Express.js
* **Rule**: The Express server is a development proxy only. 
* **Enforcement**: DO NOT write primary database queries, transactional calculations, or permission checks in Express. All core logic must reside in the target Laravel API backend.

### 2. No Mock Data in Main Branches
* **Rule**: When implementing features, write actual API calls, secure endpoints, and databases migrations. 
* **Enforcement**: Do not use hardcoded local arrays as fake backend mocks; the UI should represent real-world database states.

### 3. Row-level Tenant Isolation is Absolute
* **Rule**: No queries should run without an explicit `tenant_id` context filter.
* **Enforcement**: Ensure that joining tables check tenant mappings across all branches to eliminate data exposure risks.
