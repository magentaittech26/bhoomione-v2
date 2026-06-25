# Module: Public Marketplace Portal

## 1. Purpose
The Marketplace Portal opens up public inventories to prospective property buyers, enabling layout viewing and plot reservation options via credit card payments.

---

## 🗄️ Database Tables
* `plots`: Standard plot entities availability statuses.
* `bookings`: Reservation transactions details.
* `payments`: Stripe ledger transactions.

---

## 🛣️ API Endpoints
* `GET /api/v1/marketplace/layouts/{token}`: Fetch public georeferenced maps vector layouts.
* `POST /api/v1/marketplace/checkout`: Create Stripe Checkout Session.
* `POST /api/v1/marketplace/webhooks`: Stripe payment webhook processing.

---

## 🔐 Permissions
* **Anonymous Access**: Public endpoints do not require authorization headers but are constrained by cryptographically signed share tokens.

---

## 🔌 Dependencies
* **Stripe SDK**: Payment collection processing.
* **GIS module**: Coordinate map visualization layers.

---

## 🚦 Current Status
* **Status**: **Planning & Early Development**
* **Completion %**: 15%

---

## 🛣️ Future Roadmap
* Build dynamic, mobile-friendly 3D layout maps overlays directly in the mobile browser.
