# BhoomiOne V3 — Event Flow Architecture

## Executive Summary
BhoomiOne V3 uses an Event-Driven Architecture (EDA) alongside a synchronous database transaction model. State changes publish strongly-typed domain events to decouple non-blocking asynchronous side effects (notifications, audit logging, analytics indexing, search synchronization, AI predictions).

---

## 1. Event Dispatching Architecture

```
┌────────────────────────┐
│  Domain Service Operation│
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ DB Transaction Commit  │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│ Event Bus Dispatcher   │
└───────────┬────────────┘
            │
    ┌───────┴───────────────────────────┐
    ▼                                   ▼
[Sync Listeners]             [Async Queue Listeners]
- Cache Invalidation          - SMS / Email Alerts
- Immediate Audit Log         - PDF Receipt Generation
                              - AI Recommendation Engine
                              - Webhook Notifications
```

---

## 2. Core Event Processing Guarantees

1. **Transactional Safety**: Domain events MUST NOT be dispatched outside an active database commit. If a transaction rolls back, no event is emitted.
2. **At-Least-Once Delivery**: Asynchronous event handlers execute via Redis/RabbitMQ queues with exponential retry backoff.
3. **Idempotent Handlers**: Every event payload includes a unique `event_id` (UUID) and timestamp. Subscribers must handle duplicate events safely.
4. **Tenant Context Preservation**: Every domain event carries `tenant_id` to maintain strict tenant boundary isolation across queue workers.

---

## 3. Module Event Flow Pipelines

### Pipeline A: Plot Reservation & Booking Flow
1. User submits `POST /api/v1/tenant/bookings`.
2. `BookingService` executes transactional reservation:
   - Validates plot status is `AVAILABLE`.
   - Creates `booking` record.
   - Updates plot status to `BOOKED`.
   - Commits DB Transaction.
3. Dispatches `BookingCreated` event.
4. **Subscribers**:
   - `NotificationSubscriber`: Sends SMS & Email confirmation with cost sheet to customer.
   - `DocumentSubscriber`: Triggers asynchronous PDF agreement generation.
   - `AuditSubscriber`: Writes immutable log into `audit_logs`.
   - `AnalyticsSubscriber`: Increments monthly sales volume counter for tenant dashboard.

### Pipeline B: Payment Receipting Flow
1. Gateway webhook or manual receipt entry triggers `PaymentReceived`.
2. **Subscribers**:
   - `BookingSubscriber`: Updates payment schedule status and outstanding balance.
   - `InvoiceSubscriber`: Marks invoice status as `PAID`.
   - `NotificationSubscriber`: Sends digital payment receipt via WhatsApp / Email.
   - `AuditSubscriber`: Logs financial transaction entry.

---

## 4. AI & Analytics Consumers
Events are streamed to the BhoomiOne AI Engine to feed:
- **Plot Price Optimization AI**: Consumes `PlotStatusChanged` and `SiteVisitCompleted` to suggest dynamic demand pricing.
- **Lead Score AI Engine**: Consumes `SiteVisitCompleted` and `CustomerNoteAdded` to re-rank high-intent leads.
- **Construction Delay Prediction AI**: Consumes `MilestoneCompleted` events to forecast delivery timelines.
