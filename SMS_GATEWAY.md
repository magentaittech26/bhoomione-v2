# SMS Communication Gateway Integration Guide

BhoomiOne V2 features an enterprise-grade **SMS Broadcast Gateway Engine** built directly into its centralized notification service. This engine unifies multiple regional and international SMS providers into a single abstract dispatch interface, handling template mapping, Indian DLT compliance, real-time latency testing, delivery logging, usage telemetry, and automated exponential backoff retries.

---

## Supported Gateway Providers & Credential Mapping

The engine integrates directly with five premier SMS gateways and telecommunication channels. Configure their profiles inside the **Gateway Routers** tab:

| Provider Code | Provider Name | Dynamic Parameter Configuration Keys | Target Use-Case / Regional Strength |
| :--- | :--- | :--- | :--- |
| **`MSG91`** | MSG91 Enterprise Gateway | `auth_key`, `sender_id`, `route`, `entity_id`, `template_id` | South Asia standard for high-throughput OTPs & Transactional SMS. Strict DLT validation. |
| **`TEXTLOCAL`** | Textlocal SMS Gateway | `api_key`, `sender_id`, `custom_client_reference` | UK, Europe, and Indian regional transactional and transactional-opted delivery. |
| **`FAST2SMS`** | Fast2SMS Outbound | `api_key`, `sender_id`, `route` | Low-friction transactional alerts and quick bulk messaging services. |
| **`TWILIO_SMS`** | Twilio SMS API | `account_sid`, `auth_token`, `sender_id` | Global outbound messaging with extensive carrier routing and virtual number support. |
| **`AWS_SNS`** | Amazon Simple Notification Service | `region`, `access_key_id`, `secret_access_key`, `sender_id` | Enterprise-grade global alerts backed by AWS's distributed cloud infrastructure. |

---

## Core Features & Operations

### 1. Real-Time Connection Handshaking (Connection Test)
Before routing production traffic through a gateway, verify credentials and network latency.
- **Console Feature**: Inside the **Gateway Routers** configuration editor, click **Test Credentials**.
- **Under the Hood**: The engine performs a lightweight sandbox connection handshake. If credentials or network responses fail, detailed carrier status codes and latency diagnostics (e.g., `Latency: 38ms`) are printed live.
- **Sandbox Testing**: Use the **Test Sandbox** tab to trigger mock variables mapped to live SMS templates.

### 2. DLT Sender ID & Header Compliance
For transactional alerts routed to Indian telecom terminals, carrier compliance requires a strict 3-stage Distributed Ledger Technology (DLT) framework to combat spam.
- **Sender ID (Header)**: Exactly a 6-character alphabetic block representing your brand (e.g., `BHOOMI`, `REALTX`).
- **Principal Entity ID (PE ID)**: A 13-to-18 digit number issued to your registered company by telecommunication networks.
- **Content Template ID (CT ID)**: A unique identifier bound to individual pre-approved SMS templates (configured under **Central Templates**).
- **Console Feature**: Access the dedicated **Sender IDs & DLT** tab to manage registered headers, entity mappings, and review regulatory instructions.

### 3. Usage Statistics & Telemetry
High-fidelity visual charts power operational visibility:
- **Daily Volume curves**: Grouped bar charts showing delivery splits (SMS vs. WhatsApp vs. Email) over a rolling 7-day calendar.
- **Gateway Benchmarks**: Comparative analysis of average handshake latencies and success rates for `MSG91`, `Twilio`, `Textlocal`, `Fast2SMS`, and `AWS SNS`.
- **Channel Share**: Percentage distribution of active outbound triggers.

### 4. Interactive Retry Queue Management
Network congestion or target mobile handset unreachability can cause temporary dispatch failures.
- **Exponential Backoff**: The system queues failed alerts, scheduling up to 3 automatic retries with increasing delays.
- **Ledger Monitoring**: Go to the **Outbound Ledger** tab and toggle the **Retry Queue Only** view to filter exclusively for active retry nodes.
- **Manual Overrides**: Execute a manual sweep and flush of the queue instantly by clicking **Sweep & Retry Queue**.

---

## Developer Integration & Dispatch API

To trigger an SMS programmatically, invoke the abstract notification dispatch router:

```typescript
import { NotificationService } from "/server/services/notification";

// Dynamic transactional variables to bind to template placeholders
const variableScope = {
  customer_name: "Karan Sharma",
  unit_number: "PLOT-102",
  amount: "15,00,000",
  due_date: "2026-07-15"
};

// Dispatch non-blocking SMS alert
await NotificationService.dispatchNotification({
  event_type: "BOOKING",
  channel: "SMS",
  recipient: "+919876543210",
  variables: variableScope
});
```

### Life-Cycle Timeline Lifecycle
1. **Queue State**: Saved with status `QUEUED` and a custom audit trail ledger payload.
2. **Gateway Lookup**: The background job reads the designated `is_default` or active gateway configurations for SMS.
3. **DLT Binding**: Resolves template content with approved Sender IDs and binds the `entity_id` and `template_id` into the carrier payload (particularly for MSG91 / Textlocal).
4. **Delivered State**: Handshake succeeds, updating log status to `DELIVERED` and stamping the precise delivery latency.
5. **Failover & Backoff**: Rejection raises a retry backoff countdown, updating the ledger history until successfully sent or maximum exhaustion.
