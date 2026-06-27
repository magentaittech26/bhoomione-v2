# Phase 1F.13 Verification & Validation Test Matrix
**BhoomiOne v2 – Phase 1F.13**

## Test Case 1: Subscription Center Navigation Refactor
- **Action**: Log in as a platform user/administrator and open the Subscription Center.
- **Expected Outcome**: Verify that the top navigation bar only renders: **Plans, Add-ons, Tenant Licenses, Usage, Invoices, and Audit**. Verify that *Billing*, *Coupons*, *Promotions*, and *Plot Billing* are completely absent.

## Test Case 2: SaaS Platform Settings Grouped Sidebar
- **Action**: Navigate to SaaS Settings.
- **Expected Outcome**: Verify that the sidebar groups settings into four categories (**Platform Core, Commercial Engine, Communications, and Infrastructure & Audit**).

## Test Case 3: Relocated Plot Billing (Internal Pricing Rules)
- **Action**: In SaaS Settings, click on the "Internal Pricing Rules" tab within the "Commercial Engine" category.
- **Expected Outcome**: Verify that the plot billing slabs management UI (formerly tenant-facing Plot Billing) renders correctly with all add/edit/reorder controls fully functional.

## Test Case 4: Relocated Billing Gateway & Telemetry Logs
- **Action**: Click on "Billing & Gateway" under the "Commercial Engine" category in SaaS Settings.
- **Expected Outcome**: Verify that the editable grace period inputs render alongside Razorpay gateway status, Cron schedule, and Billing retry sequence logs.

## Test Case 5: Relocated Coupons & Promotions Tabs
- **Action**: Click on "Promo Coupons" and "Active Campaigns" in Settings.
- **Expected Outcome**: Verify that Coupons list cards and active upgrade campaign views render perfectly with complete layout fidelity.

## Test Case 6: Plan Tier Pricing Detail Cards
- **Action**: Open the Plans tab in the Subscription Center.
- **Expected Outcome**: Verify that the plan cards have the modern "Most Popular" badges, and clearly display all structured prices (monthly, yearly, one-time setup, AMC fee), alongside allocation metrics.

## Test Case 7: Build and Compilation Verification
- **Action**: Run `npm run lint` and `npm run build`.
- **Expected Outcome**: The TypeScript linter passes without any syntax errors and the production esbuild bundler finishes with an exit status code of 0.
