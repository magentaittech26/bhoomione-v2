# Marketplace API & Database Changelog

## [v1.0.0-Stable] - 2026-06-28

This release locks in the Core Marketplace Foundation with enterprise security, non-volatile audit logs, and performance caching.

### Database Alterations & New Tables
* **Added**: `developer_profiles` table hardened with `gst` tracking and `public_visibility` controls.
* **Added**: `projects` table modified with `publishing_status`, `is_featured`, `seo_settings`, `moderation_status`, and `moderation_history` properties.
* **Added**: `marketplace_moderation_history` table for immutable record logging of approval workflows.
* **Added**: `marketplace_analytics_cache` for sub-millisecond conversion and engagement counters.
* **Added**: `marketplace_view_tracking` for logging granular project hit sessions.
* **Added**: Performance indices on Status, Visibility, and Foreign Keys.

### API Changes
* **Added**: `GET /api/v1/public/marketplace/home` (Cached, high-density listing feed).
* **Added**: `GET /api/v1/public/marketplace/projects` (Advanced, multi-variable project query with paginated output).
* **Added**: `POST /api/v1/public/marketplace/leads` (Lead Capture Endpoint with automatic 24-hour duplicate follow-up merging).
* **Added**: `POST /api/v1/tenant/marketplace/developer-profile` (Management endpoints with Tenant isolation verification).
* **Added**: `POST /api/v1/tenant/marketplace/projects/{id}/publish` (Project lifecycle status triggers with cache invalidation).

### Asynchronous & Caching Services
* **Added**: Background job queue processing via `SendMarketplaceLeadNotification`.
* **Added**: High-efficiency TTL caching layer in `MarketplaceService` with atomic invalidation.
