# BhoomiOne SaaS Admin Testing Matrix & Verification Steps (Phase 1F.4)

This test matrix outlines the validation procedures, inputs, and expected outcomes to verify the correctness of the **SaaS Settings and Plot Billing Slabs** implementation.

---

## 1. Automated Verification Checks

To verify there are no syntax, typing, or build regressions across the codebase:

```bash
# Run the React/TypeScript Linter
npm run lint

# Run the Production Compilation Build
npm run build
```

---

## 2. Test Cases & Verification Steps

| Test ID | Feature Category | Action / Test Input | Verification Procedure / UI Elements | Expected Output / Results |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SET-01** | Platform Settings | Click **Settings** on left sidebar vertical menu | Observe the 6 group tabs: General, Domains, Billing, Notifications, Security, Storage, and Advanced | Tab sidebar opens showing structured business-centric fields instead of plain ingress text |
| **TC-SET-02** | Platform Settings | Edit General Settings (e.g., change "Platform Branding Name" or "Support Phone") and click **Save Settings** | Click save button, wait for spinner. Look for a success notification | Setting persists. Re-loading the tab retrieves newly edited values from PostgreSQL |
| **TC-SET-03** | Platform Settings | Click **Advanced Technical Info** tab | Check that technical Nginx port details are rendered under this sub-section only | Ingress details are present but kept safe from business configuration clutter |
| **TC-SLB-01** | Plot Billing Slabs | Navigate to **Subscription Center** -> **Plot Billing** tab | Check that Slabs list table loads dynamic values from the database | Active billing tiers are rendered, displaying custom columns for Monthly, Yearly, One-Time, and AMC prices |
| **TC-SLB-02** | Plot Billing Slabs | Click **Add Slab Template**, fill minimum, maximum plots, prices, and click save | Verify that the newly added plot range is visible in the list | A new capacity tier is created with custom values successfully |
| **TC-SLB-03** | Plot Billing Slabs | Change a Monthly or One-Time price inside any row input, and click **Save** | Check the row's state after save completes | Database is updated; success toast confirms changes have been replicated |
| **TC-SLB-04** | Plot Billing Slabs | Click **Up / Down arrows** on any row inside the Plot Billing Slabs table | Move a tier up or down | Rows swap places, and the database re-orders the slabs' `sort_order` permanently |
| **TC-SLB-05** | Plot Billing Slabs | Click **Delete** on any row | Accept the confirmation prompt | Row is deleted and vanishes from the active table list |

---

## 3. Rollback Instructions

Should you need to revert any database schemas or rollback code states:

1.  **Code Rollback**:
    ```bash
    # Revert all uncommitted workspace changes
    git checkout -- src/components/saas/AddonsBillingTab.tsx
    git checkout -- src/components/apps/SaaSAdminApp.tsx
    git delete src/components/saas/SaasSettingsTab.tsx
    ```
2.  **Database Migration Rollback**:
    If using standard Laravel migrations, you can roll back the last schema changes:
    ```bash
    cd backend-api
    php artisan migrate:rollback --step=1
    ```
