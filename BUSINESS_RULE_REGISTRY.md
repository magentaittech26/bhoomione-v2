# BhoomiOne V3 — Business Rule Registry Specification

## Executive Summary
The `RuleRegistry` maintains the central catalog of registered rules across all business modules in BhoomiOne V3.

---

## 1. Registry Capabilities
* **Duplicate Detection**: Throws `InvalidArgumentException` if a duplicate rule code is registered.
* **Module Grouping**: Resolves all rules belonging to a target module (e.g., Projects, Layouts, Plots).
* **Action Resolution**: Filters and deterministically orders rules applicable to a specific context action.
* **Dependency Topological Ordering**: Ensures prerequisite rules execute prior to dependent rules.

---

## 2. Rule Registration Pattern

```php
$registry->register(new ProjectMandatoryApprovalsCompleteRule());
$registry->register(new LayoutBoundaryPolygonRequiredRule());
$registry->register(new PlotStatusAvailableRule());
$registry->register(new BookingMinimumAmountReceivedRule());
$registry->register(new CollectionAmountNotAboveOutstandingRule());
```
