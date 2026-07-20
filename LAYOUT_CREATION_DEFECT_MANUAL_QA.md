# BHOOMIONE V3 — LAYOUT CREATION & AUTH HANDSHAKE MANUAL QA PLAYBOOK

This QA manual details the test coverage and step-by-step verification procedures for the token refresh handshake and the layout subdivision plan creation pipeline.

---

## SECTION 1: AUTHENTICATED REQUEST REPLAY & TOKEN REFRESH Handshake

This section verifies that concurrent expired access token scenarios are correctly handled by a centralized single-flight queue without race conditions or infinite loops.

### Test Scenario 1.1: Single-Flight Handshake Coalescing
- **Prerequisite**: Session storage contains a valid refresh token but an expired access token (or access token manually corrupted/removed).
- **Steps**:
  1. Trigger multiple concurrent API requests on page load (e.g., `GET /api/v1/projects` and `GET /api/v1/layouts` concurrently).
  2. Open the browser DevTools "Network" tab.
  3. Observe that exactly **one** single POST request is dispatched to `/api/v1/auth/refresh`.
  4. Verify that both pending original requests receive the new access token and replay successfully, yielding `200 OK` responses.
  5. Confirm that the UI loads both projects and layouts seamlessly without displaying unauthorized error popups or forcing premature logout.

### Test Scenario 1.2: Expired Session Hard-Logout
- **Prerequisite**: Both access token and refresh token are invalid or expired.
- **Steps**:
  1. Trigger any authenticated API endpoint.
  2. The server responds with `401 Unauthorized` for `/auth/refresh` or original requests.
  3. Observe that the `ApiClient` catches the session termination, purges stored credentials from `sessionStorage`, and gracefully redirects/reloads the page to the login state without loops.

---

## SECTION 2: LAYOUT CREATION PAYLOAD VALIDATION & SCHEMA CONGRUENCE

This section verifies that layout creation payloads conform exactly to the underlying database schema and are validated robustly with structured 422 error messages.

### Test Scenario 2.1: Initial Layout Creation (Standard DRAFT)
- **Steps**:
  1. Navigate to the Inventory Manager layout subdivision section.
  2. Click **Create Layout**.
  3. Fill out the layout details:
     - **Layout Name**: "Greenwood Sector 4"
     - **Subdivision Code**: "GW4"
     - **Classification Type**: "RESIDENTIAL"
     - **Standard Measurement Unit**: Select "Square Feet (sqft)"
     - Leave **Approval reference index** and **Authority Approval Date** blank.
  4. Notice that the **Lifecycle State** defaults to `DRAFT`.
  5. Click **Save Layout**.
  6. Verify that the layout is saved successfully (`201 Created` on `/layouts`) and that the modal closes automatically.
  7. Check database/list view to confirm the layout is created in `DRAFT` status with no approval information required.

### Test Scenario 2.2: Conditional Approval Validation
- **Steps**:
  1. Open the **Create Layout** or **Edit Layout** modal.
  2. Change the **Lifecycle State** to `APPROVED`.
  3. Leave **Approved reference index** and **Authority Approval Date** empty.
  4. Click **Save Layout**.
  5. Observe that submission is blocked, and the local validation banner at the top of the modal clearly displays:
     - `"Validation Error: Approval Reference Number is required for APPROVED layout phases."`
  6. Fill in **Approved reference index** (e.g., "APPR-GW4-2026") but leave the **Authority Approval Date** blank.
  7. Click **Save Layout**.
  8. Observe that submission is still blocked, and the validation banner displays:
     - `"Validation Error: Approval Date is required for APPROVED layout phases."`
  9. Select a valid approval date, then click **Save Layout**.
  10. Confirm that the blueprint updates successfully.

### Test Scenario 2.3: Structural Validation Rules (422 Responses)
- **Test 2.3.1: Empty Name/Code Validation**
  - Leave **Layout Name** or **Subdivision Code** blank and try to submit. Verify the validation banner flags the missing field immediately.
- **Test 2.3.2: Duplicate Name/Code Prevention**
  - Attempt to create a layout with a name or subdivision code that already exists within the selected project.
  - Verify that the API rejects the request with a structured `422 Unprocessable Entity` containing:
    - `"Validation Error: A layout phase with the same name or subdivision code already exists within this project."`
- **Test 2.3.3: Invalid Area Value**
  - Enter `-150` or `"ABC"` in the **Zoned Area value** field.
  - Verify that the validation banner displays:
    - `"Validation Error: Zoned Area value must be a positive numeric value higher than 0."`

### Test Scenario 2.4: Survey Number & Enum Normalization
- **Steps**:
  1. In the layout creation form, enter the following unnormalized survey numbers:
     - `  142/A ,  142/B,   143  ` (with multiple surrounding spaces).
  2. Save the layout.
  3. Inspect the outgoing payload in the Network tab.
  4. Confirm that the `survey_number` is normalized, split, trimmed, and packed into the approval field as:
     - `"Sy:142/A, 142/B, 143"`
  5. Verify that selecting **Classification Type** "MIXED USE" correctly passes the standardized enum `"MIXED_USE"` to the database.

---

### Verification Complete
All tests compile cleanly and comply with the architectural freeze guidelines.
