# BHOOMIONE PLATFORM STABILIZATION SPRINT (PHASE 1F.11)
## Quality Assurance Test Matrix

This matrix outlines the end-to-end integration tests conducted to verify the stability of the BhoomiOne platform after Phase 1F.11.

| Test Case ID | Feature Group | Test Scenario | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SET-01** | Settings Module | Load settings for all 15 required categories. | All 15 tabs render correctly with appropriate icons. No "No configuration keys initialized" warning visible. | As expected. Seeder runs automatically on API call. | **PASSED** |
| **TC-SET-02** | Settings Module | Modify General Platform Branding Name and support emails and click Save. | Payload is transmitted to Laravel API and saved inside PostgreSQL. Saved changes persist. | As expected. DB updated successfully. | **PASSED** |
| **TC-SET-03** | Settings Module | Edit System settings and confirm that previous custom branding choices remain unchanged. | Changing one group does not reset or erase custom parameters of other categories. | Verified. Seeder logic uses check-before-write to maintain state. | **PASSED** |
| **TC-DSH-01** | Executive Dashboard | Load Revenue Analytics and check MRR, ARR, and Today's run rate. | Metric cards display dynamic values computed from plans, slabs, and tenant subscriptions. No mock/hardcoded values. | As expected. MRR, ARR, and Daily metrics match database records. | **PASSED** |
| **TC-DSH-02** | Executive Dashboard | Audit multi-tenancy operational volumes (Projects, Layouts, Plots). | Total counts match real-time rows inside PostgreSQL tables. | As expected. Multi-tenant volume counts are live-computed. | **PASSED** |
| **TC-DSH-03** | Executive Dashboard | Observe Recent Payments ledger. | Payments are listed in INR with proper rupee groupings and custom "PAID" badge. | As expected. | **PASSED** |
| **TC-AUD-01** | Audit Log Timeline | Filter logs by Action Code Type or User Operator Search. | Log registry filters in real-time. Logs are grouped chronologically (Today, Yesterday, Older). | Verified. Stream filtering works instantly. | **PASSED** |
| **TC-AUD-02** | Audit Log Timeline | Click Inspect on a specific audit log row. | Side drawer modal slides in, detailing exact JSON diffs, client IP, and browser User-Agent headers. | Drawer renders and displays full payload metadata. | **PASSED** |
| **TC-CUR-01** | Currency Uniformity | Audit all billing, price tiers, and invoice pages. | All numbers formatted using the central `formatCurrency` helper in Lakhs/Crores grouping. No USD symbols. | Consolidated Rupee symbol `₹` used globally. | **PASSED** |
| **TC-UI-01** | UI Consistency | Run standard TypeScript / Vite build tasks. | Code builds with zero TypeScript compilation errors. | Successfully compiled. | **PASSED** |
