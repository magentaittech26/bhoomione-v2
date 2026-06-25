# AI Session Onboarding & Guardrails Guide

This document is the mandatory entry point for any AI Studio, ChatGPT, or developer assistant session initiating work on the BhoomiOne codebase. 

---

## 🚀 Mandatory Startup Prompts & Checks

Before writing any code, modifying databases, or altering server APIs, the AI assistant MUST execute the following pre-flight sequence:

### 1. Read Current Documentation First
You are strictly commanded to read the master index `/docs/README.md` and `/docs/00_Project/CURRENT_PHASE.md` first. This guarantees you understand the active development boundaries and do not write redundant code blocks.

### 2. Never Redesign Completed Modules
Existing core modules (Projects, Layouts, Plots, CAD parsing, Georeference Laravel engines) are fully complete, stabilized, and validated. **Do not attempt to rewrite or refactor these modules** unless explicitly instructed by a human developer.

### 3. Respect Target Multi-Tier Architecture
You must preserve the decoupled platform layer:
* **React 18 SPA (Vite / Tailwind)**: Represents the UI client.
* **Laravel 12 REST API (PHP 8.2)**: The **ONLY** production server.
* **Express Dev Proxy**: Solely for lightweight local environment routing. **NEVER** write transactional APIs, billing controllers, or databases migrations in Express.
* **PostgreSQL Database**: Row-level tenant isolation is absolute.

---

## 🛠️ Mandatory Pre-Implementation Checklist

Every coding task must pass these five checks before being deployed:

* **Audit First**: Always locate and review the target codebase file structure before editing. Do not assume file contents.
* **Never Hardcode Commercial Logic**: Subscription feature checks must query the database registries dynamically through the `SubscriptionFeatureGate` middleware.
* **Implicit Tenant Scopes**: Never trust user-supplied tenant IDs in JSON requests; resolve them exclusively from authenticated JWT payloads on the server.
* **No Database Schema Altering without Migrations**: All changes to PostgreSQL tables, indices, or constraints must run through standard Laravel migration scripts.
* **Verify Before Deployment**: Run the full application linter and compilation scripts to ensure clean merges:
  ```bash
  npm run lint
  npm run build
  ```
