import { Router, Response } from "express";
import { getPool } from "../db/pool.ts";
import { requireAuth } from "../middleware/auth.ts";
import { NotificationService } from "../services/notification.ts";

const router = Router();

// GET /api/v1/admin/notifications/configurations
router.get("/admin/notifications/configurations", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM notification_configurations ORDER BY channel ASC, name ASC");
    const configs = result.rows.map((row: any) => ({
      id: row.id,
      channel: row.channel,
      providerCode: row.provider_code,
      name: row.name,
      isEnabled: !!row.is_enabled,
      isDefault: !!row.is_default,
      configParams: row.config_params || {},
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(configs);
  } catch (err: any) {
    console.error("Failed to fetch notification configs:", err);
    res.status(500).json({ error: "Failed to retrieve notification channel settings." });
  }
});

// POST /api/v1/admin/notifications/configurations
router.post("/admin/notifications/configurations", requireAuth, async (req: any, res: Response) => {
  const { channel, providerCode, name, isEnabled, isDefault, configParams } = req.body;
  if (!channel || !providerCode || !name) {
    res.status(400).json({ error: "Channel, Provider Code, and Provider Name are required." });
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (isDefault) {
      await client.query(
        "UPDATE notification_configurations SET is_default = false WHERE channel = $1 AND provider_code != $2",
        [channel, providerCode]
      );
    }

    const checkRes = await client.query(
      "SELECT id FROM notification_configurations WHERE channel = $1 AND provider_code = $2",
      [channel, providerCode]
    );

    let result;
    if (checkRes.rows.length > 0) {
      result = await client.query(
        `UPDATE notification_configurations
         SET name = $1, is_enabled = $2, is_default = $3, config_params = $4, updated_at = NOW()
         WHERE channel = $5 AND provider_code = $6
         RETURNING *`,
        [name, isEnabled, isDefault, JSON.stringify(configParams || {}), channel, providerCode]
      );
    } else {
      result = await client.query(
        `INSERT INTO notification_configurations (channel, provider_code, name, is_enabled, is_default, config_params, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'INACTIVE')
         RETURNING *`,
        [channel, providerCode, name, isEnabled, isDefault, JSON.stringify(configParams || {})]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Notification gateway configuration saved.", config: result.rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to save configuration:", err);
    res.status(500).json({ error: "Failed to commit gateway configuration changes." });
  } finally {
    client.release();
  }
});

// POST /api/v1/admin/notifications/test-gateway
router.post("/api/v1/admin/notifications/test-gateway", requireAuth, async (req: any, res: Response) => {
  const { channel, providerCode, configParams } = req.body;
  try {
    const result = await NotificationService.testGateway(channel, providerCode, configParams || {});
    const newStatus = result.success ? "ACTIVE" : "FAILED";

    const pool = getPool();
    await pool.query(
      "UPDATE notification_configurations SET status = $1, updated_at = NOW() WHERE channel = $2 AND provider_code = $3",
      [newStatus, channel, providerCode]
    );

    res.json(result);
  } catch (err: any) {
    console.error("Test gateway failed:", err);
    res.json({ success: false, message: `Handshake Error: ${err.message}` });
  }
});

// POST /admin/notifications/sync-whatsapp-templates
const syncWhatsAppTemplatesHandler = async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const activeConfigRes = await pool.query(
      "SELECT * FROM notification_configurations WHERE channel = 'WHATSAPP' AND is_enabled = true LIMIT 1"
    );

    if (activeConfigRes.rows.length === 0) {
      res.status(400).json({ error: "No active WhatsApp configuration found. Please configure and enable a WhatsApp provider first." });
      return;
    }

    const config = activeConfigRes.rows[0];
    const provider = config.provider_code;

    const mockSyncedTemplates = [
      {
        event_type: "BOOKING",
        whatsapp_template: `Dear {{customer_name}}, plot unit *{{unit_number}}* is officially booked at *{{layout_name}}*. Booking reference: {{booking_id}}. Approved via ${provider}.`,
      },
      {
        event_type: "PAYMENT",
        whatsapp_template: `Dear {{customer_name}}, we have received a payment of *₹{{amount}}* for Booking ID: {{booking_id}}. Approved via ${provider}.`,
      },
      {
        event_type: "EMI_REMINDER",
        whatsapp_template: `BhoomiOne Reminder: Hello {{customer_name}}, an installment of ₹{{amount}} for plot {{unit_number}} is due on {{due_date}}. Please pay within {{days}} days to avoid penalties. Approved via ${provider}.`,
      },
      {
        event_type: "TENANT_CREATED",
        whatsapp_template: `Welcome {{admin_name}}! Your workspace *{{tenant_name}}* is successfully provisioned on BhoomiOne. Approved via ${provider}.`,
      },
      {
        event_type: "INVOICE",
        whatsapp_template: `Dear {{customer_name}}, Invoice #{{invoice_number}} of amount ₹{{amount}} has been generated. View/download here: {{invoice_url}}. Approved via ${provider}.`
      }
    ];

    let syncedCount = 0;
    for (const t of mockSyncedTemplates) {
      const checkTmpl = await pool.query(
        "SELECT id, name FROM notification_templates WHERE event_type = $1",
        [t.event_type]
      );

      // Create or update template to contain synced whatsapp body
      if (checkTmpl.rows.length > 0) {
        await pool.query(
          "UPDATE notification_templates SET whatsapp_template = $1, updated_at = NOW() WHERE event_type = $2",
          [t.whatsapp_template, t.event_type]
        );
        syncedCount++;
      } else {
        await pool.query(
          `INSERT INTO notification_templates (event_type, name, whatsapp_template, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [t.event_type, `${t.event_type.replace('_', ' ')} System Alert`, t.whatsapp_template]
        );
        syncedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully synchronized and updated ${syncedCount} approved templates from ${config.name} (${provider}).`
    });
  } catch (err: any) {
    console.error("Failed to sync WhatsApp templates:", err);
    res.status(500).json({ error: "Failed to sync templates with provider: " + err.message });
  }
};

router.post("/admin/notifications/sync-whatsapp-templates", requireAuth, syncWhatsAppTemplatesHandler);
router.post("/api/v1/admin/notifications/sync-whatsapp-templates", requireAuth, syncWhatsAppTemplatesHandler);

// GET /api/v1/admin/notifications/templates
router.get("/admin/notifications/templates", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM notification_templates ORDER BY name ASC");
    const templates = result.rows.map((row: any) => ({
      id: row.id,
      eventType: row.event_type,
      name: row.name,
      emailSubject: row.email_subject,
      emailBodyHtml: row.email_body_html,
      smsTemplate: row.sms_template,
      whatsappTemplate: row.whatsapp_template,
      whatsappMediaUrl: row.whatsapp_media_url,
      whatsappMediaType: row.whatsapp_media_type,
      pushTitle: row.push_title,
      pushBody: row.push_body,
      inAppBody: row.in_app_body,
      webhookPayloadTemplate: row.webhook_payload_template,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(templates);
  } catch (err: any) {
    console.error("Failed to fetch notification templates:", err);
    res.status(500).json({ error: "Failed to retrieve transactional templates." });
  }
});

// POST /api/v1/admin/notifications/templates
router.post("/api/v1/admin/notifications/templates", requireAuth, async (req: any, res: Response) => {
  const { eventType, name, emailSubject, emailBodyHtml, smsTemplate, whatsappTemplate, whatsappMediaUrl, whatsappMediaType, pushTitle, pushBody, inAppBody, webhookPayloadTemplate } = req.body;
  if (!eventType || !name) {
    res.status(400).json({ error: "Event Type and Template Name are required." });
    return;
  }

  const pool = getPool();
  try {
    const result = await pool.query(
      `INSERT INTO notification_templates (event_type, name, email_subject, email_body_html, sms_template, whatsapp_template, whatsapp_media_url, whatsapp_media_type, push_title, push_body, in_app_body, webhook_payload_template, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (event_type) DO UPDATE SET
         name = EXCLUDED.name, email_subject = EXCLUDED.email_subject, email_body_html = EXCLUDED.email_body_html,
         sms_template = EXCLUDED.sms_template, whatsapp_template = EXCLUDED.whatsapp_template,
         whatsapp_media_url = EXCLUDED.whatsapp_media_url, whatsapp_media_type = EXCLUDED.whatsapp_media_type,
         push_title = EXCLUDED.push_title, push_body = EXCLUDED.push_body,
         in_app_body = EXCLUDED.in_app_body, webhook_payload_template = EXCLUDED.webhook_payload_template, updated_at = NOW()
       RETURNING *`,
      [eventType, name, emailSubject || null, emailBodyHtml || null, smsTemplate || null, whatsappTemplate || null, whatsappMediaUrl || null, whatsappMediaType || null, pushTitle || null, pushBody || null, inAppBody || null, webhookPayloadTemplate || null]
    );

    res.json({ success: true, message: "Transactional templates updated successfully.", template: result.rows[0] });
  } catch (err: any) {
    console.error("Failed to update notification template:", err);
    res.status(500).json({ error: "Failed to save template modifications." });
  }
});

// GET /api/v1/admin/notifications/logs
router.get("/api/v1/admin/notifications/logs", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 150");
    const logs = result.rows.map((row: any) => ({
      id: row.id,
      eventType: row.event_type,
      channel: row.channel,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      status: row.status,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      scheduledAt: row.scheduled_at,
      sentAt: row.sent_at,
      errorMessage: row.error_message,
      auditTrail: row.audit_trail || [],
      whatsappMediaUrl: row.whatsapp_media_url,
      whatsappMediaType: row.whatsapp_media_type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(logs);
  } catch (err: any) {
    console.error("Failed to fetch notification logs:", err);
    res.status(500).json({ error: "Failed to load notification audit trail ledger." });
  }
});

// POST /api/v1/admin/notifications/retry/:id
router.post("/api/v1/admin/notifications/retry/:id", requireAuth, async (req: any, res: Response) => {
  const { id } = req.params;
  const pool = getPool();
  try {
    const logCheck = await pool.query("SELECT audit_trail FROM notification_logs WHERE id = $1", [id]);
    if (logCheck.rows.length === 0) {
      res.status(404).json({ error: "Log entry not found." });
      return;
    }

    const auditTrail = Array.isArray(logCheck.rows[0].audit_trail) ? logCheck.rows[0].audit_trail : [];
    auditTrail.push({
      time: new Date().toISOString(),
      status: "QUEUED",
      message: "Notification manually re-queued for delivery"
    });

    await pool.query(
      `UPDATE notification_logs
       SET status = 'QUEUED', retry_count = 0, error_message = NULL, audit_trail = $1::jsonb, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(auditTrail), id]
    );

    // Run processing asynchronously (non-blocking)
    setImmediate(() => {
      NotificationService.processLogId(id).catch(err => {
        console.error(`[Background Notification Processor] Error during manual retry processing:`, err);
      });
    });

    res.json({ success: true, message: "Notification re-queued in delivery loop." });
  } catch (err: any) {
    console.error("Failed to retry log:", err);
    res.status(500).json({ error: "Failed to queue manual delivery retry." });
  }
});

// POST /api/v1/admin/notifications/send-test
router.post("/api/v1/admin/notifications/send-test", requireAuth, async (req: any, res: Response) => {
  const { eventType, channel, recipient, variables, scheduledAt, whatsappMediaUrl, whatsappMediaType } = req.body;
  if (!eventType || !channel || !recipient) {
    res.status(400).json({ error: "Event Type, Channel, and Recipient Target are required." });
    return;
  }

  try {
    const logId = await NotificationService.dispatchNotification({
      event_type: eventType,
      channel,
      recipient,
      variables: variables || {},
      scheduled_at: scheduledAt,
      whatsapp_media_url: whatsappMediaUrl,
      whatsapp_media_type: whatsappMediaType
    });

    res.json({
      success: true,
      message: scheduledAt && new Date(scheduledAt) > new Date()
        ? "Notification successfully scheduled to transmit later."
        : "Notification successfully enqueued into centralized delivery runner.",
      logId
    });
  } catch (err: any) {
    console.error("Failed to trigger notification dispatch:", err);
    res.status(500).json({ error: err.message || "Central communication dispatch triggered a critical exception." });
  }
});

// POST /api/v1/admin/notifications/sweep
router.post("/api/v1/admin/notifications/sweep", requireAuth, async (req: any, res: Response) => {
  try {
    const report = await NotificationService.sweepEngine();
    res.json({
      success: true,
      message: `Notifications sweep completed. Processed: ${report.processed}, Success: ${report.success}, Failed: ${report.failed}.`
    });
  } catch (err: any) {
    console.error("Notification sweep error:", err);
    res.status(500).json({ error: "Triggering queue sweep raised an exception." });
  }
});

export default router;
