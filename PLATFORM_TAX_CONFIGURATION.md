# Platform Tax & Invoice Configuration Spec

This document details the schema parameters, operational coefficients, and functional rules of the **Platform Tax & Invoice Configuration** system.

---

## 1. Storage Schema Details

All configuration keys are persisted within the global `saas_settings` table. 

### Managed Key Registry

On saving changes in the Platform Tax Console, the system updates or bootstraps the following records:

| Group | Setting Key | Data Type | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| **COMPANY** | `company_name` | string | `BhoomiOne Technologies Pvt Ltd` | Legal entity name shown as issuer |
| **COMPANY** | `corporate_address` | string | *Full physical address* | Physical headquarters registered office |
| **COMPANY** | `pan_number` | string | `ABCDE1234F` | Corporate Permanent Account Number |
| **COMPANY** | `cin_number` | string | `U72200KA2023PTC123456` | Corporate Identity Number (Optional) |
| **COMPANY** | `registered_state` | string | `KA` | Registered corporate home state code |
| **GST** | `gst_number` | string | `29AAAAA1111A1Z1` | Issuer Corporate Goods & Services Tax ID |
| **GST** | `gst_enabled` | boolean | `true` | Globally toggle tax assessment on platform invoices |
| **GST** | `cgst_percentage` | number | `9` | Central GST coefficient rate |
| **GST** | `sgst_percentage` | number | `9` | State GST coefficient rate |
| **GST** | `igst_percentage` | number | `18` | Integrated GST inter-state coefficient rate |
| **GST** | `reverse_charge_enabled` | boolean | `false` | Apply reverse-charge regulations if active |
| **GST** | `sac_code` | string | `997331` | SaaS / IT licensing services accounting code |
| **GST** | `hsn_code` | string | `8524` | Equipment/hardware sales harmonized system code |
| **BILLING** | `invoice_prefix` | string | `BO-INV-` | Unique prefix prepend for standard invoices |
| **BILLING** | `credit_note_prefix` | string | `BO-CN-` | Unique prefix prepend for credit notes |
| **BILLING** | `debit_note_prefix` | string | `BO-DN-` | Unique prefix prepend for debit notes |
| **GST** | `apply_gst_saas` | boolean | `true` | Apply tax on SaaS base subscription |
| **GST** | `apply_gst_addons` | boolean | `true` | Apply tax on add-on feature modules |
| **GST** | `apply_gst_marketplace` | boolean | `true` | Apply tax on developer marketplace fees |
| **GST** | `apply_gst_featured` | boolean | `true` | Apply tax on featured real estate listings |
| **GST** | `apply_gst_amc` | boolean | `true` | Apply tax on annual contract software renewals |
| **GST** | `apply_gst_support` | boolean | `true` | Apply tax on dedicated corporate support plans |

---

## 2. Platform Tax Assessment & Invoicing Rules

Platform tax calculations operate on a **destination-based origin comparison** structure:

- **Intra-state Billing**: If the builder's workspace account billing state matches the Platform's `registered_state` (e.g. `KA`):
  $$\text{CGST} = \text{Subtotal} \times \frac{\text{cgst\_percentage}}{100}$$
  $$\text{SGST} = \text{Subtotal} \times \frac{\text{sgst\_percentage}}{100}$$
  $$\text{Total GST} = \text{CGST} + \text{SGST}$$
- **Inter-state Billing**: If the builder's workspace account billing state differs from the Platform's `registered_state` (e.g., `MH` vs `KA`):
  $$\text{IGST} = \text{Subtotal} \times \frac{\text{igst\_percentage}}{100}$$
  $$\text{Total GST} = \text{IGST}$$

---

## 3. Interactive Preview Logic

The console provides a real-time responsive invoice simulator which allows admins to test coefficients immediately prior to committing records to production:
- Accepts a dynamic base SaaS subscription plan price.
- Accepts an optional add-on cost value.
- Re-calculates and renders base subtotal, tax breakdown (CGST/SGST/IGST), and total sum.
- Updates physical document visualizers in real-time, matching standard corporate layout requirements.
