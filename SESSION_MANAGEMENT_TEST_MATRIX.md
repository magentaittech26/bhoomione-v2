# Session Management Test Matrix

This matrix outlines the test cases, validation routes, expected outcomes, and step-by-step verification flows to ensure continuous multi-tenant security and logout stability.

---

## 1. Domain-Agnostic Login/Logout Verifications

### Test ID: TM-01
- **Target Gateway**: `admin.bhoomione.in` (SaaS Admin Portal)
- **Role Credentials**: Administrator (`admin@bhoomione.in` / `adminpass123`)
- **Verification Flow**:
  1. Navigate to the SaaS Admin entrance card.
  2. Authenticate using prefilled admin credentials.
  3. Verify successful entrance into the SaaS Control Center.
  4. Press the **"Disconnect"** button.
- **Expected Outcome**: Tokens are erased, and the viewport instantly transitions back to the clean admin login card.

---

### Test ID: TM-02
- **Target Gateway**: `bhoomi-alpha.bhoomione.in` (Tenant Workspace Portal)
- **Role Credentials**: Tenant Owner (`owner@developer1.com` / `password123`)
- **Verification Flow**:
  1. Resolve workspace domain parameters for target tenant code `bhoomi-alpha`.
  2. Authenticate using the tenant administrator login inputs.
  3. Confirm the dashboard header reflects the valid workspace.
  4. Click the **"Revoke Session Token"** button.
- **Expected Outcome**: Clear transient arrays in local storage, evicting the user immediately to the guest authorization screen.

---

## 2. Platform Refresh & Session Preservation

### Test ID: TM-03
- **Scenarios Checked**:
  - `admin.bhoomione.in` Active Session
  - `bhoomi-alpha.bhoomione.in` Active Session
  - Customer Portal Buyer Workspace (`arjun@villas.in`)
  - Agent Portal Broker Console (`sarah@agents.in`)
- **Verification Flow**:
  1. Sign in successfully to any of the above portals and interact with the inner menus.
  2. Execute a hard page reload (`Ctrl + F5` or standard browser refresh).
  3. Re-verify active viewport status.
- **Expected Outcome**: The active tokens are retrieved from `localStorage`/`sessionStorage` automatically on mount, and the user remains logged in on the dashboard with zero disruption.

---

## 3. Passive 401 Interceptions and Session Hard-Evictions

### Test ID: TM-04
- **Trigger Scenario**: Session token expired or mocked invalid handshake check returns a `401 Unauthorized` HTTP code from the backend container pool.
- **Verification Flow**:
  1. From an authenticated state, simulate a server request receiving a `401` status (e.g., token expiration).
  2. Observe client response handling in the browser console.
- **Expected Outcome**:
  - Transparent refresh is attempted if a refresh token is present.
  - If refresh fails or is absent, the client triggers `bhoomi_unauthorized`, purges all token pools, and redirects the viewport instantly to the guest authentication view.

---

## 4. Maintenance / Gateway 502 Bad Gateway Shielding

### Test ID: TM-05
- **Trigger Scenario**: Server API gateway is undergoing maintenance or server container crashes, returning an Nginx/PHP `502 Bad Gateway` string.
- **Verification Flow**:
  1. Disable API connection context or request a broken system route.
  2. Inspect the returned UI exception container.
- **Expected Outcome**: The interface suppresses raw HTML mockups, displaying a polished human-readable message: *"The server gateway is currently undergoing maintenance. Please retry in a few moments."*
