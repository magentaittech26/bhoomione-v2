# BhoomiOne SaaS Admin Phase 1F.5A Test Matrix

This matrix outlines the test cases, validation inputs, expected behaviors, and actual outcomes to ensure compliance with Phase 1F.5A specifications.

---

## 1. Test Suite: SaaS Platform Settings Initialization

| Test ID | Test Scenario | Steps | Expected Behavior | Actual Status |
|---|---|---|---|---|
| **SET-01** | Empty Settings DB Auto-seeding | 1. Access SaaS Settings tab on a fresh database. <br>2. Observe if rows load automatically. | The backend detects `0` count in settings, runs `SaasPlatformSettingsSeeder`, and serves populated lists immediately. | **Passed** |
| **SET-02** | Manual Seeder Execution | 1. Execute `php artisan db:seed --class=SaasPlatformSettingsSeeder --force` from CLI. | Database populates successfully with 44 rows; no duplicate constraint violations. | **Passed** |
| **SET-03** | Group Saving | 1. Select GENERAL tab. <br>2. Edit `platform_name` and click Save. | Only current settings group is serialized; changes persist successfully in PostgreSQL. | **Passed** |
| **SET-04** | Non-Destructive Update Check | 1. Modify a setting manually.<br>2. Re-run Seeder. | Custom setting values are preserved and not overwritten. | **Passed** |

---

## 2. Test Suite: Dynamic Revenue Analytics Dashboard

| Test ID | Test Scenario | Steps | Expected Behavior | Actual Status |
|---|---|---|---|---|
| **DASH-01** | Currency Localization | 1. Access Dashboard tab. <br>2. Inspect currency metrics. | All monetary amounts are formatted with the ₹ / INR currency helper. No hardcoded USD signs. | **Passed** |
| **DASH-02** | Live MRR & ARR Calculations | 1. Change a tenant's subscription tier. <br>2. Reload Dashboard. | MRR is recalculated instantly based on baseline active tiers and enabled add-ons. ARR displays a perfect 12x multiplier. | **Passed** |
| **DASH-03** | Tenant Count Sync | 1. Load active, trial, suspended subscriptions. | Count of Active/Trial/Suspended tenants perfectly reflects database values. | **Passed** |
| **DASH-04** | Not Configured Placeholder Check | 1. View Global Cloud Storage card. | Displays a polished "Not configured" state, strictly avoiding simulated telemetry. | **Passed** |

---

## 3. Test Suite: Audit Logs Telemetry Usability

| Test ID | Test Scenario | Steps | Expected Behavior | Actual Status |
|---|---|---|---|---|
| **AUD-01** | Default System Noise Filtering | 1. Open Audit Logs. <br>2. Review the logs. | System is clean of repetitive `TOKEN_REFRESH` actions. | **Passed** |
| **AUD-02** | Show System Noise Override | 1. Toggle "Hide system noise" off. | `TOKEN_REFRESH` records stream in instantly to allow exhaustive low-level analysis. | **Passed** |
| **AUD-03** | Advanced Parameter Filtering | 1. Query by operator "system" or specific action. | Lists are subset accurately by the PostgreSQL backend. | **Passed** |
| **AUD-04** | Date Range Validation | 1. Apply Date From / To filters. | Only log timestamps falling within the boundaries are displayed. | **Passed** |
| **AUD-05** | Payload State Inspector | 1. Click "Inspect" button. | Opens a clean drawer modal containing raw JSON parameters for `new_values` and `old_values`. | **Passed** |

---

## 4. Automation and Compilation Validation

| Test ID | Test Scenario | Steps | Expected Behavior | Actual Status |
|---|---|---|---|---|
| **V-01** | Static Linter Run | 1. Execute `npm run lint`. | Completes successfully with exit code 0. | **Passed** |
| **V-02** | Production Build compilation | 1. Execute `npm run build`. | Compiles all chunks into `dist/` successfully with no type violations. | **Passed** |
