# BhoomiOne V2 Campaign & Promotions Framework Specification

The BhoomiOne V2 SaaS platform includes a high-fidelity **Active Campaigns & Promotions Manager** designed to automate, schedule, and track advertising inventory and marketing events on central digital nodes. This document details the technical layouts, supported campaign slot channels, and calculation engines.

---

## 1. Core Campaign Types

The engine supports eight distinct campaign slots to fit various operational requirements:

| Slot Type | Technical Enumeration | Purpose & Placement Scope |
| :--- | :--- | :--- |
| **Marketplace** | `MARKETPLACE` | Promotes developer layouts, third-party add-ons, or custom themes in the theme bazaar. |
| **Featured Builder** | `FEATURED_BUILDER` | Spotlights premium real estate developers on high-visibility directories and home maps. |
| **Featured Project** | `FEATURED_PROJECT` | Spotlights specific construction or residential plotting projects directly inside visitor dashboards. |
| **Homepage Banner** | `HOMEPAGE_BANNER` | Dynamically cycles hero banner cards shown to prospective visitors based on current date. |
| **Email Campaign** | `EMAIL` | Outbound transactional and promotional updates injected with active tracking codes. |
| **WhatsApp Campaign** | `WHATSAPP` | High-open-rate template messages pushed directly to verified broker circles and agents. |
| **Push Campaign** | `PUSH` | Web and mobile push notifications targeted to users with saved plots or templates. |
| **Lead Campaign** | `LEAD` | Paid marketing lead acquisition waves integrated with landing page capture and analytics. |

---

## 2. Dynamic Scheduling & Zone Locks

- **Active Schedules**: Campaigns bear a strict `startDate` and `endDate`.
- **Timezone Locking**: Regulated against central cron triggers synced to the user-selected timezone (e.g., `Asia/Kolkata` or `UTC`).
- **Automated Rotation**: Handshake query endpoints automatically filter out finished campaigns (`endDate < CurrentEpoch`) or paused items to ensure optimal layout utilization.

---

## 3. Financial Analytics & ROI Formulas

The console computes real-time conversion yields, allowing marketing coordinators to evaluate live performance metrics:

### Cost Per Lead (CPL)
$$\text{CPL} = \frac{\text{Campaign Spend}}{\text{Total Leads Acquired}}$$

### Conversion Rate (CVR %)
$$\text{CVR} = \left( \frac{\text{Conversions}}{\text{Total Leads}} \right) \times 100$$

### Return On Investment (ROI %)
$$\text{ROI} = \left( \frac{\text{Conversion Revenue} - \text{Campaign Spend}}{\text{Campaign Spend}} \right) \times 100$$

---

## 4. Integration Verification

To test handshakes and query banner slots, administrators can utilize the **Simulator Playground** in the settings workspace or programmatically request listings:

```typescript
import { CampaignRouter } from "src/lib/campaigns";

// Fetching valid active home slider campaigns
const activeBanners = await CampaignRouter.getLiveCampaigns({
  type: "HOMEPAGE_BANNER",
  timezone: "Asia/Kolkata"
});
```
