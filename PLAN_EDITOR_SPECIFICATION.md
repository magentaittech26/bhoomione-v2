# BhoomiOne v2: Plan Editor Specification

This document defines the interface layout and data synchronization requirements for the advanced Plan Editor.

## 1. Interface Tab Structure
The Plan Editor utilizes an elegant, single-view 4-tab workflow that consolidates all pricing plan parameters:

| Tab ID | Tab Name | Core Functions | Fields Managed |
|--------|----------|----------------|----------------|
| **GENERAL** | General | Basic plan metadata, naming, and status | Name, Plan Code, Description, Sort Order, Status, Trial Period (Days) |
| **PRICING** | Pricing | Base tier recurrence configuration | Monthly Price (INR), Yearly Price (INR), One-Time Startup Fees (INR) |
| **LIMITS** | Limits | Upper bounds on resource provisioning | Storage Capacity (GB), Users Limit, Project Count Limit, Custom Map Uploads |
| **FEATURES** | Features | Toggle individual system module access | GIS Maps, DXF CAD Exporters, Advanced Legal Search, SMS/WhatsApp Gateways |

## 2. Dynamic Data Saving Flow
All changes made inside the Plan Editor are validated client-side and saved atomically to the database via standard Laravel endpoints.

```
[ Frontend: PlanEditor ] ──(JSON Payload)──> [ Laravel: SaasController@savePlan ]
                                                   │
                                            (Validate Params)
                                                   ▼
                                        [ SaasSubscriptionService ]
                                                   │
                                      (Atomically updateOrCreate)
                                                   ▼
                                         [ PostgreSQL DB Tables ]
```

### Save Payload Contract (JSON Example)
```json
{
  "plan_code": "PRO_YEARLY",
  "name": "Professional Tier",
  "monthly_price": 4999.00,
  "yearly_price": 49990.00,
  "trial_days": 14,
  "sort_order": 2,
  "status": "ACTIVE",
  "limits": [
    { "limit_key": "max_storage_gb", "limit_value": 50 },
    { "limit_key": "max_users", "limit_value": 15 }
  ],
  "feature_ids": [
    "gis_viewer",
    "dxf_exporter",
    "advanced_search"
  ]
}
```

## 3. Backward Compatibility Constraints
- The `plan_code` acts as the unique lookup key to prevent record duplication.
- Deleting or disabling a feature does not drop existing tenant configurations; instead, it safely disables the corresponding module flag dynamically on next session handshake.
