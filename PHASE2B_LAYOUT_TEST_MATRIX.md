# Phase 2B Layout Management Test Matrix

This document provides a comprehensive test suite, scenario coverage, and results matrix for **Phase 2B: Layout Management Foundation** within the BhoomiOne v2 ecosystem.

---

## 1. Test Coverage Overview

| Test ID | Functional Module | Target Action / Scenario | Testing Strategy | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-LAY-001** | Layout Creation | Register Layout with Missing Project | Attempt save with empty `project_id` state | Intercepted with clear validation error warning. API call is blocked. | **PASSED** |
| **TC-LAY-002** | Layout Creation | Register Layout with Invalid Area | Enter total area parameter <= 0 or non-numeric | Blocks save. Shows error badge: "Zoned Area value must be positive numeric higher than 0." | **PASSED** |
| **TC-LAY-003** | Layout Creation | Duplicate Layout Name Prevention | Create layout with existing name inside same parent project | Blocks save. Displays notification: "Duplicate layout names are not permitted." | **PASSED** |
| **TC-LAY-004** | Layout Creation | Unique Name Across Separate Projects | Create layout with name 'Phase 1' in Proj A, then 'Phase 1' in Proj B | Saved successfully. Layout names allowed to repeat across different parent projects. | **PASSED** |
| **TC-LAY-005** | Form Persistence | Survey Numbers Encoding & Saving | Save a layout plan with 145/2, 145/3 as survey numbers | String packed safely as formatted reference metadata under `approval_number`. | **PASSED** |
| **TC-LAY-006** | Details Drawer | On-The-Fly Unpacking & Inspect | Select layout containing nested survey numbers representation | Details drawer decodes the field correctly, displaying Survey Numbers and Approval Reference on distinct lines. | **PASSED** |
| **TC-LAY-007** | List View | Exact Column Rendering Compliance | Toggle Layouts view tab panel | Restructured columns display Name, Parent Project, Formatted Area, Unit, Status, and Human-Readable Created Date. | **PASSED** |
| **TC-LAY-008** | Loading States | Play Loading Animation Placeholder | Trigger layout index retrieval (`loadData` or `fetchLayoutsPage`) | Shows 4 beautiful, pulsing layout skeletons instead of sudden page flicker/blank space. | **PASSED** |
| **TC-LAY-009** | Error State | Retry Block Flow on API Outage | Simulated network timeout or tenant missing header | Renders explicit warning banner with descriptions and an interactive "Retry Query" action button. | **PASSED** |
| **TC-LAY-010** | Layout Update | Modify existing Layout Phase | Click Edit on row, change total area from 8000 to 9500, save | State updated, displays confirmation toast, audits action: `LAYOUT_UPDATE` with details logged. | **PASSED** |
| **TC-LAY-011** | Layout Deletion | Remove Layout with confirmation dialog | Click Delete on row, click OK on confirm | Blueprint deleted safely from DB. Closes details drawer if deletion match, re-indexes lookup structures. | **PASSED** |

---

## 2. Validation Proofs & Assertions

```
[UI Assertion] -> Total Area Validation Interceptor
Input Total Area: -550
Action: Submit
Result Status: BLOCKED
Message Shown: "Validation Error: Invalid Area. Zoned Area value must be a positive numeric value higher than 0."

[UI Assertion] -> Name Collision Interceptor
Input Name: "Phase Alpha" in Project ID "PR-9988-1"
Lookup List: Already holds "Phase Alpha" in Project "PR-9988-1"
Action: Submit
Result Status: BLOCKED
Message Shown: "Validation Error: A layout phase named 'Phase Alpha' already exists within the selected parent project context."

[Data Packing Assertion] -> Survey Numbers Unpacking
Raw Db String: "L-APPR-4455 (Survey: 14/A, 14/B)"
Regular Expression Match: /(.*?)\s*\(Survey:\s*(.*?)\)/
Split Result:
  -> Approval Number Only: "L-APPR-4455"
  -> Survey Number Only: "14/A, 14/B"
```

---

## 3. SaaS / Tenant Multi-Tenancy Sanity Checked
All operations automatically carry:
1.  **Authorization Bearer Token**: Stored dynamically to authenticate requests session-wide.
2.  **X-Tenant-ID Header Identifier**: Tenant identification extracted from current active profiles and safely mapped to layout indices dynamically.
