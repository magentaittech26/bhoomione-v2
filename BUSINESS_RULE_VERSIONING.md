# BhoomiOne V3 — Business Rule Versioning Specification

## Executive Summary
This document specifies semantic versioning standards for business rules and policies in BhoomiOne V3.

---

## 1. Versioning Rules
* **Major Version Bump (`2.0.0`)**: Material change in rule logic or evaluation contracts.
* **Minor Version Bump (`1.1.0`)**: Adding optional fields or non-breaking evidence parameters.
* **Patch Version Bump (`1.0.1`)**: Performance fixes or message wording updates.

---

## 2. Audit Snapshot
When a rule evaluates, its exact `version` string is stored in `business_rule_evaluation_results.rule_version`. Historical audit records retain the rule version evaluated at transaction time, preventing retro-active misinterpretation.
