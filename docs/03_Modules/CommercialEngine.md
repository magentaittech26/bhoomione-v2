# Module: Commercial & Subscription Engine

## 1. Purpose
The Commercial Engine calculates standard subscription plans billing, manages plan catalog parameters, gates premium features, and handles manual tenant feature overrides.

---

## 🗄️ Database Tables
* `saas_plans`: Standard plan catalogs definitions (`STARTER`, `GROWTH`, `ENTERPRISE`).
* `saas_features`: Standard platform feature codes (`gis_maps`, `cad_upload`).
* `subscription_plan_features`: Pivot association linking features to plans.
* `tenant_subscriptions`: Tracks tenant subscriptions, start date, and end date.
* `tenant_feature_overrides`: Explicit tenant feature overrides (`ENABLED`, `DISABLED`).

---

## 🛣️ API Endpoints
* `GET /api/v1/saas/plans`: List standard plan catalogs.
* `GET /api/v1/saas/subscription/my-summary`: Get active tenant subscription status, feature list, and usage limits.
* `POST /api/v1/saas/overrides`: Set manual feature overrides (Global Admin only).

---

## 🔐 Permissions
* **SaaS Admin**: Global administration permissions are required to edit base features list or define plan overrides.

---

## 🔌 Dependencies
* **Auth**: Fully verified via JSON Web Tokens.

---

## 🚦 Current Status
* **Status**: **Production Ready**
* **Completion %**: 100%

---

## 🛣️ Future Roadmap
* Integrate dynamic Stripe subscription billing synchronizations inside Laravel.
