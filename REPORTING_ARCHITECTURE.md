# BhoomiOne V3 — Reporting & Analytics Architecture

## Executive Summary
This specification defines reporting module ownership, data warehouse boundaries, executive dashboards, and analytics pipelines in BhoomiOne V3.

---

## 1. Reporting Categories & Ownership

### A. Sales & Commercial Reports (`App\Modules\Crm` & `App\Modules\Booking`)
* **Reports**: Lead Conversion Funnel, Agent Performance Metrics, Booking Velocity, Plot Sales Heatmap, Discount Variance Analysis.
* **Update Frequency**: Near real-time via indexed database views and Redis cache.

### B. Financial & Collection Reports (`App\Modules\Financials`)
* **Reports**: Accounts Receivable Aging, Outstanding Collection Schedule, Tax/GST Reconciliation, Cashflow Forecast, Refund & Cancellation Summary.
* **Update Frequency**: Daily batch aggregation and real-time ledger drill-down.

### C. Inventory & MDM Reports (`App\Modules\Plot` & `App\Modules\Layout`)
* **Reports**: Plot Status Breakdown (Available vs Booked vs Sold), Square Footage / Measurement Unit Utilization, Sector Density Analysis.
* **Update Frequency**: Real-time.

### D. Construction & Development Reports (`App\Modules\Construction`)
* **Reports**: Milestone Progress vs Baseline, Infrastructure Cost Variance, Road Network Delivery Status.
* **Update Frequency**: Weekly site audit reporting.

---

## 2. Analytics Pipeline & Data Isolation

```
[ Operational OLTP DB ]
         │
         ▼ (Change Data Capture / Domain Events)
┌────────────────────────┐
│ Reporting Warehouse Engine │ (Isolated Read Replicas / Aggregates)
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Executive Dashboards    │ (Interactive Charts & Exportable PDFs/Excel)
└────────────────────────┘
```

---

## 3. Executive KPI Dashboard Specs
1. **Gross Realization Rate**: Total booked plot value / total available plot inventory value.
2. **Average Selling Price (ASP)**: Average price per Square Foot / Square Meter across projects.
3. **Collection Efficiency**: Total payments collected / total payment schedule due amount ($%$).
4. **Lead Conversion Ratio**: Percentage of leads converted to confirmed plot bookings.
