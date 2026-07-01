# Promo Coupons & Campaign Management System Guide

BhoomiOne V2 features an enterprise-grade **Promo Coupons & Campaign Management System** built directly into its centralized SaaS Settings workspace. This framework enables super-administrators to model, configure, simulate, and track diversified discount schemas and seasonal marketing waves.

---

## 1. Supported Promo Coupon Types

The engine supports six distinct coupon configurations tailored to specific customer cohorts, partners, and modules:

| Coupon Type | Technical Enumeration | Behavior & Application Scope | Example Value |
| :--- | :--- | :--- | :--- |
| **Percentage** | `PERCENTAGE` | Applies a rolling percentage discount on total subscription rates or transaction sub-totals. | `25` (25% Off) |
| **Fixed Cash** | `FIXED` | Deducts a flat cash value from the invoice payable. Maximum limit is capped at the base sub-total. | `₹10,000` Flat Off |
| **Referral Promo** | `REFERRAL` | Links redemption logs to affiliate/broker circles and registers referral reward credits. | `₹5,000` Referral Code |
| **Builder Exclusive** | `BUILDER` | Custom corporate vouchers restricted to real estate developers expanding plot-capacity tiers. | `₹75,000` Waiver |
| **Marketplace Credit** | `MARKETPLACE` | Redeemable exclusively for premium layouts, themes, or custom templates in the BhoomiOne App Store. | `₹12,500` Free Credit |
| **Tenant Waiver** | `TENANT` | Custom waivers strictly bound to a specific tenant identifier node to prevent cross-account exploitation. | `15%` Tenant waiver |

---

## 2. Core Constraints & Features

### Expiry Timers
- Every registered promo coupon must bear a strict ISO expiry date (e.g., `2026-12-31`).
- The evaluation engine automatically verifies the handshake timestamp. Attempts to redeem expired coupons raise a clear `Validation Rejection: Code has EXPIRED` warning.

### Usage Quota Limits
- Define a total hard maximum limit of uses (e.g., `500` uses).
- The console tracks current utilization with interactive progress bars (e.g., `112 / 150 Uses`).
- Upon reaching exhaustion capacity, the coupon's status automatically transitions to `EXHAUSTED` in the registry.

### Campaign Linking & Mapping
- Initiate seasonal marketing campaigns (e.g., *Monsoon Launch V2*, *Affiliate Referral Circle*) and link multiple coupon codes under a single master identifier.
- Track total campaign redemptions, start/end dates, and marketing channel mediums (Email, Social, Partners, Direct).

### Sandbox Simulation Playground
- Evaluate coupon codes live in the sandbox.
- Supply dynamic sub-totals, simulated Tenant IDs, builder names, and channel scopes.
- Preview full validation results, error codes (such as restricted Tenant bindings, scope mismatch, or expired dates), and see a detailed invoice pricing breakdown.

### Reporting & Telemetry Analytics
- High-fidelity visual intelligence panels powered by Recharts:
  - **Weekly Promotion Redemptions**: Daily bar charts showing volume curves.
  - **Coupon Type Distribution**: Pie charts tracking active formats in the register.
  - **Direct CSV Ledger Export**: Export redemption logs and cost savings summaries.

---

## 3. Developer API & Handshake Verification

BhoomiOne V2 manages promotional campaigns and coupons via the following REST API endpoints under `/api/v1`:

### Endpoint Registry

| Method | URI | Description | Form Request | API Resource | Policy Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/coupons` | List all coupons. | - | `PromoCouponResource` | `view` |
| **POST** | `/api/v1/admin/coupons` | Create or update a coupon. | `PromoCouponRequest` | `PromoCouponResource` | `manage` |
| **DELETE** | `/api/v1/admin/coupons/{id}` | Delete a coupon. | - | - | `manage` |
| **GET** | `/api/v1/admin/campaigns` | List all campaigns. | - | `PromoCampaignResource` | `view` |
| **POST** | `/api/v1/admin/campaigns` | Create or update a campaign. | `PromoCampaignRequest` | `PromoCampaignResource` | `manage` |
| **DELETE** | `/api/v1/admin/campaigns/{id}` | Delete a campaign. | - | - | `manage` |
| **POST** | `/api/v1/admin/coupons/simulate` | Simulate coupon validation. | Custom Validation | Custom JSON | Guest/Admin |

---

## 4. Backend Implementation Architecture

### Form Requests
- **`PromoCouponRequest`**: Validates input formats, requires explicit types, positive coupon discount values, and valid expiry dates.
- **`PromoCampaignRequest`**: Validates campaign name, type (e.g., EMAIL, MARKETPLACE), duration boundaries, and budgets.

### Security Policies
- **`PromoCouponPolicy`**: Limits viewing or editing coupons to authorized platform administrators or tenant accounts owning that coupon partition.
- **`PromoCampaignPolicy`**: resticts campaign registration and budgeting changes exclusively to global system administrators.

### API Resources
- **`PromoCouponResource`**: Converts database keys to client camelCase JSON formats and resolves nested relations (`campaignName`).
- **`PromoCampaignResource`**: Aggregates live redemption metrics, active coupon counts, and ROI margins on the fly.

---

## 5. Client Integration Handshake Example

To integrate promo coupon verification programmatically in the billing or checkout flow, invoke the coupon validation router:

```typescript
import { CouponService } from "/server/services/coupons";

// Validate a coupon handshake request from a client tenant
const evaluation = await CouponService.validateCoupon({
  code: "BHOOMI25",
  baseAmount: 250000,
  tenantId: "T-8819",
  builderName: "Royal Meadows Developers",
  scope: "SUBSCRIPTION"
});

if (evaluation.isValid) {
  console.log(`Discount applied: ₹${evaluation.discountAmount}`);
  console.log(`New Sub-total: ₹${evaluation.finalAmount}`);
} else {
  console.error(`Validation Failed: ${evaluation.errorMessage}`);
}
```

### Evaluation Validation Pipeline Checklist
1. **Registered Registry Search**: Check if code exists inside active database registers.
2. **Expiry Verification**: Confirm current epoch time is less than or equal to coupon expiry date.
3. **Quota Check**: Ensure `currentUses` is strictly less than `maxUses`.
4. **Scope Matching**: Confirm marketplace-exclusive coupons are not applied to core subscriptions.
5. **Context Binding Check**: Validate if coupon is bound to a specific `tenantId` or restricted to a specific developer group name.
6. **Apply Discount**: Execute math calculations, applying percentage fractions or subtracting fixed flat totals, capping deductions at base sub-totals.
