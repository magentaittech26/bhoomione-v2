# WhatsApp Multi-Gateway Integration Engine

BhoomiOne V2 features a robust, fully enterprise-grade **WhatsApp Communication Gateway** built directly into its centralized notification engine. The gateway provides unified abstract dispatch endpoints, template synchronization, background retry handling, real-time sandbox simulation, and full rich media attachment support across seven global WhatsApp Business Solution Providers (BSPs).

---

## Supported Providers & Credentials

To enable WhatsApp transactional messaging, configure any of the following BSPs through the BhoomiOne Notification Control Console:

| Provider Code | Provider Name | Required Parameters | Purpose / Focus |
| :--- | :--- | :--- | :--- |
| **`META_WA`** | Meta WhatsApp Cloud API | `phone_number_id`, `business_id`, `access_token` | Direct official Meta API. Best for high volume. |
| **`TWILIO_WA`** | Twilio WhatsApp API | `account_sid`, `auth_token`, `whatsapp_phone` | Ideal for existing Twilio customers with Twilio-hosted numbers. |
| **`INTERAKT`** | Interakt Gateway | `api_key`, `sender_id` | Highly popular in South Asia for automated engagement workflows. |
| **`GUPSHUP`** | Gupshup Gateway | `app_id`, `auth_token`, `source_phone` | Enterprise BSP with robust hybrid interactive support. |
| **`360DIALOG`** | 360Dialog API | `api_key`, `channel_id` | Developer-first BSP. Standard low latency direct API. |
| **`AISENSY`** | AiSensy Gateway | `api_key`, `campaign_name` | Campaign and broadcast specialized customer platform. |
| **`WATI`** | WATI Gateway | `endpoint_url`, `access_token` | Team inbox and automated customer support gateway. |

---

## Key Capabilities

### 1. Unified Message dispatch
The engine translates abstract triggers into provider-specific payloads. You compile dynamic values (e.g., `{{customer_name}}`, `{{amount}}`) in your templates, and the engine ensures they are safely dispatched.
- **Example Template Body**: `Hello *{{customer_name}}*, your payment of Rs. *{{amount}}* for booking unit *{{unit_number}}* has been confirmed! Reference: {{id}}.`

### 2. Full Media Message Support
Send files directly inline with your template alerts. The engine handles attachments across four mime-classes:
- 📷 **`IMAGE`**: Perfect for visual brochures, plot maps, and instant greeting flyers.
- 📄 **`DOCUMENT`**: Send financial invoices, receipt ledger PDFs, and unsigned land draft agreements dynamically.
- 🎵 **`AUDIO`**: Send custom voice note reminders and voice ledger recordings.
- 🎥 **`VIDEO`**: Perfect for project walkthrough videos and construction status recordings.

In the template configuration panel or the Sandbox testing tab, supply a dynamic media placeholder or static URL:
- **`whatsapp_media_url`**: `https://bhoomione.com/api/v1/invoices/{{invoice_id}}.pdf`
- **`whatsapp_media_type`**: `DOCUMENT`

### 3. Meta Template Sync API
Under the Templates panel, click **Sync WhatsApp Templates** to make a direct background API pull to Meta's approved Cloud template register. This updates the local transactional template definitions to align exactly with Meta's verified messaging configurations, preventing template-matching rejection errors.

- **API Route**: `POST /api/v1/admin/notifications/sync-whatsapp-templates`
- **Behavior**: Retrieves authorized templates, normalizes them, and merges them into the system's local database.

### 4. Direct Sandbox Simulator
Test and iterate your notifications immediately from the interactive **Communication Dispatch Sandbox** tab.
- Input custom variable scopes via strict JSON formatting.
- Toggle between channels (WhatsApp, Email, SMS, Push, In-App, Webhooks) to verify dynamic substitution.
- Track delivery status telemetry in real-time under the **Audit Trail Telemetry Ledger**.

### 5. Webhooks & Delivery Callbacks
For status webhook routing, BhoomiOne supports registering outgoing webhook routes.
- Webhook channel parses your custom JSON schema (e.g., `{"event": "booking.confirmed", "data": {{payload}} }`) and forwards events to registered consumer URLs with custom authorization headers and signature secrets to prevent payload spoofing.

---

## Technical Architecture & Lifecycle Flow

1. **Trigger Phase**: The business logic raises an event (e.g., `PAYMENT_RECEIVED`).
2. **Compilation Phase**: `NotificationService.dispatchNotification()` resolves variables using the template register, merging media URLs.
3. **Queue Phase**: The notification is saved with state `QUEUED` and an initial audit ledger timeline entry.
4. **Dispatch Phase**: The async queue worker pulls the record, reads the active gateway configuration, validates credentials, and posts to the respective BSP.
5. **Callback Phase**: On successful gateway handshake, the ledger updates to `DELIVERED`. On timeout or failure, the retry manager triggers exponential backoff (up to 3 retries) with live error logging.
