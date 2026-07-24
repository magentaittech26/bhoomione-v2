# BhoomiOne V3 — Business Rule Testing Guide

## Executive Summary
This guide outlines the unit, integration, and CLI test suites for validating the Business Rules Engine.

---

## 1. Unit Testing Rules
Unit tests in `tests/Unit/BusinessRules/BusinessRuleEngineTest.php` cover:
- Rule registration and duplicate code rejection.
- Rule evaluation matching and execution order.
- Pass / Fail outcome logic for all reference rules.
- Fail-Closed behavior when exceptions occur.
- Override resolution logic.

---

## 2. CLI Test Commands
```bash
# List all rules
php artisan business-rules:list

# Validate registry integrity
php artisan business-rules:validate

# Test evaluation via CLI
php artisan business-rules:evaluate plot.book plot plot-123 --explain

# View evaluation audit logs
php artisan business-rules:audit
```
