# Subscription Center Information Architecture
**BhoomiOne v2 – Phase 1F.13**

## 1. Context
The Subscription Center is the focal point for tenant billing and active package limits management. Unwanted administrative tools previously cluttered this dashboard, leading to customer confusion regarding plot billing vs. plan choices.

## 2. Refined Information Architecture
The tenant-facing navigation has been reduced to six high-level sub-tabs, completely eliminating all plot-slab configuration views and billing infrastructure keys:

1. **Plans (`plan-master`)**
   - Main lander showing active subscription cards.
   - Summarizes available plans (Starter, Growth, Professional, Enterprise).
   - Showcases capacity caps (projects, plots, storage) and enabled capabilities.

2. **Add-ons (`addons`)**
   - Catalog of swappable extra features or additional capacity extensions.
   - Grouped into three buckets: Feature addons, Capacity addons, and Service addons.

3. **Tenant Licenses (`tenant-licenses`)**
   - Active sub-licenses assigned to corporate workspaces or sub-tenants.
   - Status, dates, and allocation limits database.

4. **Usage (`usage`)**
   - Real-time consumption trackers relative to plan caps (e.g., plots drawn, active projects, file storage used).

5. **Invoices (`invoices`)**
   - Corporate financial history. Downloads for historical GST invoices, receipts, and line-item statements.

6. **Audit (`audit`)**
   - Transactional audit log history detailing licensing actions, plan transitions, and tenant profile adjustments.
