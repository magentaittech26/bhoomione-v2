# Commercial UX Consolidation Specification
**BhoomiOne v2 – Phase 1F.13**

## 1. Overview
This document specifies the UX consolidation and information architecture overhaul of the BhoomiOne Commercial Engine. The core objective is to transition from a chaotic hybrid "Plot Billing / Subscription" model to a unified **Subscription Plan** model, where customers buy a Plan (e.g. Starter, Growth, Professional, Enterprise) and resources like plots are treated strictly as a consumption limit within that Plan.

## 2. Core Architecture
The system relies on a rigid **React SPA → Laravel API → PostgreSQL** stack:
- **No Express Business Logic**: All plans, add-ons, limits, and pricing are retrieved from PostgreSQL via Laravel REST APIs.
- **No Hardcoded Configurations**: The frontend dynamically renders values and limits from DB configurations.

## 3. Key Consolidation Outcomes
1. **Subscription Center Refactor**: Removed administrative/non-commercial tabs ("Billing", "Coupons", "Promotions", "Plot Billing") from the tenant-facing subscription view.
2. **Settings Restructure**: Integrated payment gateway integration settings, corporate coupons, marketing campaign banners, and plot-capacity billing slabs into the consolidated **SaaS Settings** workspace.
3. **Plan Editor Overhaul**: Created a structured four-tab (General, Pricing, Limits, Features) Advanced Plan Editor modal for complete product configuration.
4. **Enhanced Visual Cards**: Restructured plan cards to display all pricing dimensions (monthly, yearly, one-time, annual maintenance) and resource capacity caps clearly.
