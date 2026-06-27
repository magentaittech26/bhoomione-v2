# BhoomiOne v2: Commercial Test Matrix

This matrix guides the continuous integration and quality assurance verification checks for the commercial engine.

## 1. Automated Assertion Checklist

| Component Tested | Test Type | Expected Results | Assertion Methods |
|------------------|-----------|------------------|-------------------|
| `SaasSubscriptionService` | Backend Unit Test | Correctly creates/updates base subscription plan | Assert DB contains `plan_code` and associated price keys. |
| `SaasSubscriptionService` | Backend Unit Test | Re-assigning limits removes legacy records cleanly | Query limits table to confirm count matches current matrix. |
| `SaasController` | API Endpoint | Reject pricing with negative decimal values | Assert HTTP response code `422 Unprocessable Entity`. |
| `SaaSAdminApp` | Frontend Component | Loads module registry without duplicate category values | Inspect rendered categories using component tree. |
| `ModuleRegistryTab` | Frontend Component | Columns are arranged in exact specified layout order | Validate DOM elements order dynamically. |

## 2. Manual Acceptance Criteria (QA Protocol)

### Test Case 1: Tenant Slabs Isolation
1. Login to the SaaS Control Panel as a System Administrator.
2. Verify "Plot Billing" is completely removed from the main sidebar and Subscription Center tabs.
3. Open "Settings" -> Select "Internal Pricing Rules".
4. Confirm you can edit and save plot slabs, and verify they load cleanly from PostgreSQL.

### Test Case 2: Modular Add-ons Validation
1. Navigate to "Subscription Center" -> Click the "Add-ons" tab.
2. Confirm that Add-ons are categorized cleanly into Feature, Capacity, and Service buckets.
3. Modify an add-on's pricing and confirm it reflects across the dashboard.
