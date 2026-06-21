# Session Management Implementation Report

This report documents the frontend session management updates implemented to ensure robust login persistence, secure logout operations, dynamic 401 unauthorized handle interception, and clean, raw-error-free user messaging.

---

## 1. Multi-Store Token Persistence

Session tokens and administrator/tenant profiles are now dually tracked and persisted in both browser-level `localStorage` and `sessionStorage` in `ApiClient`:

- **Page Refresh Survival**: Upon a page reload or iframe context refresh, the application seamlessly restores state using localized storage lookups.
- **Role Isolation Safe-checks**: The system retrieves the logged-in user profile, maintaining separation across domains and sandboxes.
- **Portals Persistence**: Integrated parallelized persistence layers inside the Customer Portal and Agent Portal contexts, granting complete refresh support.

---

## 2. Global Revocation Interceptor (401 Interception)

The global API client has been upgraded with a standard authorization sentinel:

- **Auth Event Invalidation**: If a protected resource request returns a `401 Unauthorized` response (or if the refresh token rotation fails), the client:
  1. Instantly invokes `clearTokens()` to purge both session and local storages.
  2. Dispatches a high-priority, non-blocking window event `bhoomi_unauthorized`.
- **Automatic View Invalidation**: The SaaS Admin and Tenant Workspace dashboards register active event listeners responding to `bhoomi_unauthorized`, immediately evicting expired or invalid sessions and transitioning visitors to their respective entry-gate login portals.

---

## 3. Graceful Error Handling & Fallbacks

To ensure absolute shield resilience of our application presentation:
- **No Stack Traces**: Avoids exposing raw stack traces or internal environment indicators.
- **Raw HTML Neutralization**: Intercepts server anomalies (such as a `502 Bad Gateway` raw response or a `500` PHP/MySQL string leak), converting them into safe, readable descriptive statements (e.g., *"The server gateway is currently undergoing maintenance. Please retry in a few moments."*) before propagation.
- **Secure Fail-safes**: Failed requests fallback to customized error message dialog bars seamlessly.

---

## 4. Dashboard Logout Modules

A visible, interactive Logout module is integrated into all four operational workspace systems:
- **SaaS Admin Panel**: Controlled by the visible "Disconnect" action.
- **Tenant Workspace**: Bound to the "Revoke Session Token" button on the dashboard.
- **Customer Portal**: Powered by the "Log out" layout action button.
- **Agent Portal**: Triggered by the "Log out" sales console component.

*Note: All logout actions fully wipe all access tokens, refresh tokens, profiles, and transient credentials from local and session storage memory pools.*
