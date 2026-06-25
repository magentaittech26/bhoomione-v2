# Marketplace Portal Architecture

BhoomiOne incorporates a public-facing customer portal. This allows external prospects to browse parcel availability matrices, inspect layout overlays on satellite maps, and place reservation deposits on selected plots.

---

## 🛒 Public-Private Portal Separation

```
         +-------------------------------------+
         |      Protected Admin Workspace      |
         |     (React Dashboard / Laravel)     |
         +-------------------------------------+
                            ||
             (Generates Public Portal Token)
                            ||
                            \/
         +-------------------------------------+
         |      Public Marketplace Ingress     |
         |     (Anonymous React Router State)  |
         +-------------------------------------+
                            ||
                 (Downpayment via Stripe)
                            ||
                            \/
         +-------------------------------------+
         |    Laravel Collections Ledger       |
         |   (Instantly Marks Plot as SOLD)    |
         +-------------------------------------+
```

---

## 🔑 Stateless Public Share Tokens

* Administrators can share layout catalogs with the public using cryptographically signed tokens.
* Public paths resolve as `/marketplace/layouts/{share_token}`.
* The Laravel API validates token parameters:
  * Ensures the tenant account remains active and subscription features allow public sharing.
  * Filters out sensitive project variables (e.g., land purchase price, interior notes), returning only sales-ready geometry vectors and dimensions.

---

## 💳 Stripe Downpayment Booking Ledger
* When a prospect clicks **Reserve Plot**, the platform creates a temporary, 15-minute transactional lock on the database plot entity, preventing double-bookings.
* A Stripe Checkout Session is initialized via `/api/v1/marketplace/checkout`.
* Upon a successful Stripe Webhook notification (`checkout.session.completed`), the platform:
  1. Instantly transitions the plot state to `RESERVED`.
  2. Generates a new Customer CRM profile.
  3. Records a payment transaction ledger entry.
  4. Dispatches receipt emails to both buyer and tenant.
