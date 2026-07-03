# BhoomiOne V3 – GST & Tax API Endpoints

This document describes the API endpoints exposed by the BhoomiOne V3 Laravel Backend for managing tax rules, running calculations, recording invoices, and generating compliance analytics.

---

## 1. Get All Tax Rules

Retrieve all configured tax rules.

* **URL**: `/api/v1/admin/tax-rules`
* **Method**: `GET`
* **Headers**:
  * `Authorization: Bearer <token>`
  * `x-tenant-id: <tenant-uuid>` (Optional. Required for tenant-specific scope filtering)

### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "7ca6b8c9-9400-4b36-a832-6bf7a38e8cb2",
      "tenant_id": null,
      "tenant_name": null,
      "tax_type": "CGST",
      "name": "Central GST Base Rate",
      "rate_percentage": "9.00",
      "state_code": "ALL",
      "effective_from": "2026-07-01",
      "effective_to": null,
      "is_active": true,
      "is_default": true,
      "builder_name": null,
      "amount_type": "percentage",
      "fixed_amount": "0.00"
    }
  ]
}
```

---

## 2. Save Tax Rule (Create / Update)

Register a new tax rule or revise an existing rule.

* **URL**: `/api/v1/admin/tax-rules`
* **Method**: `POST`
* **Headers**:
  * `Authorization: Bearer <token>`
  * `Content-Type: application/json`

### Request Payload
```json
{
  "id": "optional-uuid-for-updates",
  "tenantId": "11111111-1111-4111-8111-111111111111",
  "taxType": "STAMP_DUTY",
  "name": "Karnataka Stamp Levy",
  "ratePercentage": 5.60,
  "stateCode": "KA",
  "effectiveFrom": "2026-07-01",
  "effectiveTo": "2027-06-30",
  "isActive": true,
  "isDefault": false,
  "builderName": "Bhoomi Dev",
  "amountType": "percentage",
  "fixedAmount": 0.00
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Tax rule saved successfully.",
  "data": {
    "id": "7ca6b8c9-9400-4b36-a832-6bf7a38e8cb2"
  }
}
```

---

## 3. Delete Tax Rule (Soft Delete)

Soft-delete a rule from the active calculation pipeline.

* **URL**: `/api/v1/admin/tax-rules/{id}`
* **Method**: `DELETE`
* **Headers**:
  * `Authorization: Bearer <token>`

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Tax rule soft deleted successfully."
}
```

---

## 4. Run Tax Calculation Simulation

Simulate inter-state/intra-state tax rates, stamp duty, registration charges, and TDS calculations.

* **URL**: `/api/v1/admin/tax-rules/calculate`
* **Method**: `POST`
* **Headers**:
  * `Authorization: Bearer <token>`
  * `Content-Type: application/json`

### Request Payload
```json
{
  "baseAmount": 6500000,
  "customerState": "MH",
  "builderState": "KA",
  "tenantId": "11111111-1111-4111-8111-111111111111"
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "baseAmount": 6500000,
  "taxableAmount": 6500000,
  "cgstAmount": 0,
  "sgstAmount": 0,
  "igstAmount": 1170000,
  "tdsAmount": 65000,
  "stampDutyAmount": 325000,
  "registrationCharges": 65000,
  "otherCharges": 0,
  "totalTaxAmount": 1625000,
  "totalInvoiceAmount": 8125000,
  "stateCode": "MH",
  "isInterstate": true,
  "breakdown": [
    {
      "name": "Interstate IGST Rule",
      "taxType": "IGST",
      "rate": 18.00,
      "amount": 1170000
    },
    {
      "name": "Sec 194IA TDS Levy",
      "taxType": "TDS",
      "rate": 1.00,
      "amount": 65000
    }
  ]
}
```

---

## 5. Record Tax Invoice (Ledger Log)

Log a finalized tax-compliant transaction onto the immutable ledger.

* **URL**: `/api/v1/admin/tax-rules/invoice`
* **Method**: `POST`
* **Headers**:
  * `Authorization: Bearer <token>`
  * `Content-Type: application/json`

### Request Payload
```json
{
  "invoiceNumber": "INV-2026-0092",
  "customerName": "Rohan Malhotra",
  "stateCode": "KA",
  "baseAmount": 4500000,
  "cgstAmount": 225000,
  "sgstAmount": 225000,
  "igstAmount": 0,
  "tdsAmount": 45000,
  "stampDutyAmount": 270000,
  "registrationCharges": 45000,
  "otherCharges": 0,
  "totalTaxAmount": 810000,
  "totalInvoiceAmount": 5310000
}
```

### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Immutable tax compliance transaction logged successfully."
}
```

---

## 6. Fetch Compliance Reports

Generate metrics on active/expired rules, state-wise ledger totals, monthly tax splits, and top revenue states.

* **URL**: `/api/v1/admin/tax-rules/reports`
* **Method**: `GET`
* **Headers**:
  * `Authorization: Bearer <token>`

### Response (`200 OK`)
```json
{
  "success": true,
  "summary": {
    "totalCollected": 14250000.00,
    "totalGst": 9200000.00,
    "totalTds": 1250000.00,
    "totalStampDuty": 3800000.00
  },
  "stateWise": [
    { "state_code": "KA", "total": 7500000.00 },
    { "state_code": "MH", "total": 6750000.00 }
  ],
  "monthlyTotals": [
    { "month": "Jun 2026", "total": 4500000.00 },
    { "month": "Jul 2026", "total": 9750000.00 }
  ],
  "transactions": [
    {
      "id": "f8a02cdd-8cc2-48ea-b769-dcf6bf3b9340",
      "invoice_number": "INV-2026-0092",
      "customer_name": "Rohan Malhotra",
      "total_invoice_amount": "5310000.00"
    }
  ]
}
```
