# BhoomiOne V3 – GST & Tax Compliance Test Matrix

The tax engine must pass the following validation matrix to verify statutory calculations, overlap prevention checks, soft deletions, and RBAC authorization constraints.

---

## 1. Compliance Calculator Test Cases

| Test Case ID | Scenario / Description | Input Parameters | Expected Result / Math | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CALC-001** | **Intra-State GST (KA to KA)** | Base: ₹40,00,000<br>Cust State: KA<br>Builder State: KA<br>Rule standard CGST (9%), SGST (9%) | Base: ₹40,00,000<br>CGST: ₹3,60,000<br>SGST: ₹3,60,000<br>IGST: ₹0<br>TDS: ₹0 (Below threshold)<br>**Final Invoice: ₹47,20,000** | **PASS** |
| **TC-CALC-002** | **Inter-State GST (KA to MH)** | Base: ₹40,00,000<br>Cust State: MH<br>Builder State: KA<br>Rule standard IGST (18%) | Base: ₹40,00,000<br>CGST: ₹0<br>SGST: ₹0<br>IGST: ₹7,20,000<br>TDS: ₹0 (Below threshold)<br>**Final Invoice: ₹47,20,000** | **PASS** |
| **TC-CALC-003** | **Section 194IA TDS Trigger** | Base: ₹60,00,000<br>Cust State: KA<br>Builder State: KA<br>TDS standard rate (1%) | Base: ₹60,00,000<br>CGST: ₹5,40,000<br>SGST: ₹5,40,000<br>TDS: ₹60,000 (Triggered since > ₹50L)<br>**Final Invoice: ₹71,40,000** | **PASS** |
| **TC-CALC-004** | **Fixed Amount Levy** | Base: ₹20,00,000<br>Zoning State: KA<br>Rule Other Levy: ₹15,000 (Fixed) | Base: ₹20,00,000<br>Other Charges: ₹15,000 (Flat)<br>**Final Invoice: ₹20,15,000** | **PASS** |

---

## 2. Configuration Conflict & Overlap Prevention Test Cases

| Test Case ID | Conflict Rule Description | Input / Trigger | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-OVP-001** | **Identical Active Ranges** | Register two identical rules for `State: KA`, `Tax Type: CGST`, `Tenant: NULL` | API blocks creation with `422 Unprocessable Entity` ("Overlapping active tax rules detected"). | **PASS** |
| **TC-OVP-002** | **Effective Date Overlap** | Rule A: `KA, CGST` [01-Jul-2026 to 31-Dec-2026]<br>Rule B: `KA, CGST` [15-Dec-2026 to 30-Jun-2027] | API detects range collision [15-Dec to 31-Dec] and rejects Rule B. | **PASS** |
| **TC-OVP-003** | **Builder Scope Coexistence** | Rule A: `KA, CGST` [Platform Global]<br>Rule B: `KA, CGST` [Builder Override] | Rules coexist successfully. Calculator correctly prioritizes Rule B (Builder Scope) when evaluating for that tenant. | **PASS** |

---

## 3. Storage & Soft-Deletion Test Cases

| Test Case ID | Operations Workflow | Verified Action | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SD-001** | **Preserve historical transaction math** | 1. Calculate and log invoice using Rule A (rate 12%).<br>2. Soft-delete Rule A from admin console.<br>3. Query historic transactions report. | 1. Rule is soft-deleted (`deleted_at` timestamps correctly).<br>2. Historical transaction displays pristine calculated values of 12% with no data loss or null crashes. | **PASS** |

---

## 4. Security & Isolation Test Cases

| Test Case ID | Actor Scope | Verified Action | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SEC-001** | **Cross-Tenant Attack Vector** | Tenant B tries to delete a tax rule belonging to Tenant A via `DELETE /api/v1/admin/tax-rules/{id}` | API returns `403 Forbidden` (Enforced via `TaxRulePolicy`). | **PASS** |
| **TC-SEC-002** | **Audit Log Execution** | Save/modify dynamic tax rules or log transactions as admin. | System logs details to `audit_logs` table capturing operator name, IP address, exact action (e.g., `tax_rule.created`, `tax_rule.deleted`). | **PASS** |
