# Marketplace Performance & Query Optimization Report

This report outlines database performance, N+1 query mitigations, and caching rules.

## 1. Relational Eager Loading (Avoid N+1)

By default, Eloquent lazy-loads relations, leading to substantial backend delays on collections.
* **Eager Load Setup**: Every query retrieves layouts, plots, and tenant variables collectively using:
  ```php
  Project::whereIn('publishing_status', ['Published', 'Featured'])
      ->with(['tenant', 'layouts' => function($q) {
          $q->where('visibility', '!=', 'Private')->with('plots');
      }])
  ```
* This reduces database round-trips from $O(N)$ down to $O(1)$ query binds.

## 2. Indexed Search Attributes

Indices are defined on all columns queried inside search workflows:
* `projects(publishing_status, is_featured)`
* `developer_profiles(public_visibility, verification_status)`
* `marketplace_view_tracking(project_id)`

## 3. High-Performance Caching Layer

The main landing page query loads multiple project and developer structures. To ensure sub-10ms performance:
* **Caching Engine**: Handled via `Cache::remember('marketplace_home_feed', 300, ...)` with a 5-minute TTL.
* **Proactive Invalidation**: Calls `MarketplaceService::invalidateHomeFeedCache()` inside tenant edit endpoints to guarantee the latest listings are visible immediately on modification.
