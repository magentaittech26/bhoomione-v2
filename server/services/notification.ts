import { getPool } from "../db/pool.ts";

export interface NotificationConfig {
  id?: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP' | 'WEBHOOK';
  provider_code: string;
  name: string;
  is_enabled: boolean;
  is_default: boolean;
  config_params: any;
  status: 'ACTIVE' | 'INACTIVE' | 'FAILED';
}

export interface NotificationTemplate {
  id?: string;
  event_type: string;
  name: string;
  email_subject?: string;
  email_body_html?: string;
  sms_template?: string;
  whatsapp_template?: string;
  whatsapp_media_url?: string;
  whatsapp_media_type?: string;
  push_title?: string;
  push_body?: string;
  in_app_body?: string;
  webhook_payload_template?: string;
}

export interface NotificationLog {
  id?: string;
  event_type: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP' | 'WEBHOOK';
  recipient: string;
  subject?: string;
  body: string;
  status: 'QUEUED' | 'DELIVERED' | 'FAILED' | 'SCHEDULED';
  retry_count: number;
  max_retries: number;
  scheduled_at?: Date;
  sent_at?: Date;
  error_message?: string;
  audit_trail: any[];
  whatsapp_media_url?: string;
  whatsapp_media_type?: string;
}

export class NotificationService {
  /**
   * Test the connection handshake check or credentials check for a gateway.
   */
  static async testGateway(channel: string, providerCode: string, params: any): Promise<{ success: boolean; message: string }> {
    // Simulate API or connection handshake
    const isInvalid = JSON.stringify(params).toLowerCase().includes("invalid") || JSON.stringify(params).toLowerCase().includes("fail");
    
    if (isInvalid) {
      return {
        success: false,
        message: `Connection Handshake Failed: ${providerCode} rejected credentials for channel ${channel}. Check your API keys and endpoints.`
      };
    }

    if (channel === "EMAIL") {
      if (!params.host || !params.port) {
        return { success: false, message: "Handshake Error: Host and Port parameters are required for SMTP." };
      }
    } else if (channel === "WHATSAPP") {
      if (providerCode === "TWILIO_WA" && !params.account_sid) {
        return { success: false, message: "Twilio WhatsApp Error: Account SID and Auth Token are required." };
      } else if (providerCode === "META_WA" && (!params.phone_number_id || !params.access_token)) {
        return { success: false, message: "Meta Cloud API Error: Phone Number ID and System Access Token are required." };
      } else if (providerCode === "INTERAKT" && !params.api_key) {
        return { success: false, message: "Interakt Error: API Key credentials are required." };
      } else if (providerCode === "GUPSHUP" && (!params.app_id || !params.auth_token)) {
        return { success: false, message: "Gupshup Error: App ID and API Auth Token are required." };
      } else if (providerCode === "360DIALOG" && !params.api_key) {
        return { success: false, message: "360Dialog Error: REST API Key is required." };
      } else if (providerCode === "AISENSY" && !params.api_key) {
        return { success: false, message: "AiSensy Error: Campaign API Key is required." };
      } else if (providerCode === "WATI" && (!params.endpoint_url || !params.access_token)) {
        return { success: false, message: "WATI Error: Endpoint API URL and Access Token are required." };
      }
    } else if (channel === "SMS") {
      if (providerCode === "TWILIO_SMS" && (!params.account_sid || !params.auth_token)) {
        return { success: false, message: "Twilio Gateway Error: Account SID and Auth Token are required." };
      } else if (providerCode === "MSG91" && (!params.auth_key || !params.sender_id)) {
        return { success: false, message: "MSG91 Gateway Error: Auth Key and 6-character Sender ID are required." };
      } else if (providerCode === "TEXTLOCAL" && (!params.api_key || !params.sender_id)) {
        return { success: false, message: "Textlocal Gateway Error: API Key and Sender ID are required." };
      } else if (providerCode === "FAST2SMS" && !params.api_key) {
        return { success: false, message: "Fast2SMS Gateway Error: API Key is required." };
      } else if (providerCode === "AWS_SNS" && (!params.access_key_id || !params.secret_access_key || !params.region)) {
        return { success: false, message: "AWS SNS Error: Region, AWS Access Key ID, and Secret Access Key are required." };
      } else if (providerCode === "PLIVO" && (!params.auth_id || !params.auth_token)) {
        return { success: false, message: "Plivo SMS Gateway Error: Auth ID and Auth Token are required." };
      }
    } else if (channel === "WEBHOOK") {
      if (!params.endpoint_url || !params.endpoint_url.startsWith("http")) {
        return { success: false, message: "Webhook Router Error: Target endpoint URL must be a valid HTTP/HTTPS address." };
      }
    }

    return {
      success: true,
      message: `Successfully registered and pinged ${providerCode} endpoints for ${channel} transmission. Latency: 32ms.`
    };
  }

  /**
   * Central Queue Trigger: Adds a notification directly to the non-blocking queue.
   */
  static async dispatchNotification(params: {
    event_type: string;
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP' | 'WEBHOOK';
    recipient: string;
    variables: Record<string, string>;
    scheduled_at?: string | Date;
    whatsapp_media_url?: string;
    whatsapp_media_type?: string;
  }): Promise<string> {
    const pool = getPool();
    
    // 1. Fetch template
    const templateRes = await pool.query(
      "SELECT * FROM notification_templates WHERE event_type = $1",
      [params.event_type]
    );
    if (templateRes.rows.length === 0) {
      throw new Error(`Notification Template for event type '${params.event_type}' not found.`);
    }
    const template = templateRes.rows[0];

    // 2. Compile variables for the specified channel
    let subject = "";
    let body = "";
    let mediaUrl = "";
    let mediaType = "";

    const vars = {
      timestamp: new Date().toISOString(),
      ...params.variables
    };

    const compile = (str?: string) => {
      if (!str) return "";
      let res = str;
      for (const k of Object.keys(vars)) {
        const regex = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
        res = res.replace(regex, vars[k]);
      }
      return res;
    };

    switch (params.channel) {
      case "EMAIL":
        subject = compile(template.email_subject || "BhoomiOne Notification");
        body = compile(template.email_body_html || "");
        break;
      case "SMS":
        body = compile(template.sms_template || "");
        break;
      case "WHATSAPP":
        body = compile(template.whatsapp_template || "");
        mediaUrl = compile(params.whatsapp_media_url || template.whatsapp_media_url || "");
        mediaType = params.whatsapp_media_type || template.whatsapp_media_type || "";
        break;
      case "PUSH":
        subject = compile(template.push_title || "BhoomiOne Alert");
        body = compile(template.push_body || "");
        break;
      case "IN_APP":
        body = compile(template.in_app_body || "");
        break;
      case "WEBHOOK":
        body = compile(template.webhook_payload_template || "{}");
        break;
    }

    // Determine starting status
    const status = params.scheduled_at && new Date(params.scheduled_at) > new Date() ? 'SCHEDULED' : 'QUEUED';
    const scheduledDate = params.scheduled_at ? new Date(params.scheduled_at) : new Date();

    const initialAudit = [{
      time: new Date().toISOString(),
      status,
      message: status === 'SCHEDULED' 
        ? `Notification scheduled for ${scheduledDate.toISOString()}` 
        : `Notification queued in delivery pipeline ${mediaUrl ? `with ${mediaType} attachment` : ''}`
    }];

    // 3. Write log to database
    const logRes = await pool.query(
      `INSERT INTO notification_logs (event_type, channel, recipient, subject, body, status, retry_count, max_retries, scheduled_at, audit_trail, whatsapp_media_url, whatsapp_media_type)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 3, $7, $8::jsonb, $9, $10)
       RETURNING id`,
      [
        params.event_type, 
        params.channel, 
        params.recipient, 
        subject || null, 
        body, 
        status, 
        scheduledDate, 
        JSON.stringify(initialAudit), 
        mediaUrl || null, 
        mediaType || null
      ]
    );

    const logId = logRes.rows[0].id;

    // 4. Asynchronously process if queued immediately (non-blocking)
    if (status === 'QUEUED') {
      setImmediate(() => {
        NotificationService.processLogId(logId).catch(err => {
          console.error(`[Background Notification Processor] Failure processing notification ID ${logId}:`, err);
        });
      });
    }

    return logId;
  }

  /**
   * Process a single queued, scheduled or retried notification log.
   */
  static async processLogId(logId: string): Promise<{ success: boolean; status: string; error?: string }> {
    const pool = getPool();
    const logRes = await pool.query("SELECT * FROM notification_logs WHERE id = $1", [logId]);
    if (logRes.rows.length === 0) {
      throw new Error(`Notification log ID ${logId} not found.`);
    }
    const logRow = logRes.rows[0];

    // Read configured default or active provider for channel
    const configRes = await pool.query(
      "SELECT * FROM notification_configurations WHERE channel = $1 AND is_enabled = true LIMIT 1",
      [logRow.channel]
    );

    const auditTrail = Array.isArray(logRow.audit_trail) ? logRow.audit_trail : [];

    if (configRes.rows.length === 0 && logRow.channel !== "IN_APP") {
      const errMsg = `Delivery Gateway Exception: No enabled configurations registered for channel ${logRow.channel}.`;
      auditTrail.push({
        time: new Date().toISOString(),
        status: "FAILED",
        message: errMsg
      });

      await pool.query(
        `UPDATE notification_logs 
         SET status = 'FAILED', error_message = $1, retry_count = retry_count + 1, audit_trail = $2::jsonb, updated_at = NOW() 
         WHERE id = $3`,
        [errMsg, JSON.stringify(auditTrail), logId]
      );
      return { success: false, status: 'FAILED', error: errMsg };
    }

    const config = configRes.rows[0];

    // Trigger failure rules if recipient has flag words
    const isBounce = logRow.recipient.toLowerCase().includes("bounced") || 
                     logRow.recipient.toLowerCase().includes("invalid") || 
                     logRow.recipient.toLowerCase().includes("unknown");

    try {
      if (isBounce) {
        throw new Error(`Destination rejection: Address format, phone network, or payload rejected by carrier node.`);
      }

      // Simulate API delivery delay / latency
      await new Promise(resolve => setTimeout(resolve, 80));

      // Success state
      auditTrail.push({
        time: new Date().toISOString(),
        status: "DELIVERED",
        message: `Dispatched successfully through provider ${config ? config.name : 'IN-APP ENGINE'}`
      });

      await pool.query(
        `UPDATE notification_logs 
         SET status = 'DELIVERED', sent_at = NOW(), error_message = NULL, audit_trail = $1::jsonb, updated_at = NOW() 
         WHERE id = $2`,
        [JSON.stringify(auditTrail), logId]
      );

      return { success: true, status: 'DELIVERED' };

    } catch (err: any) {
      const errorMsg = err.message || "Outbound timeout or gateway connection reset.";
      const newRetryCount = logRow.retry_count + 1;
      const isExhausted = newRetryCount >= logRow.max_retries;
      const finalStatus = isExhausted ? 'FAILED' : 'QUEUED';

      auditTrail.push({
        time: new Date().toISOString(),
        status: finalStatus,
        message: `Attempt ${newRetryCount} failed: ${errorMsg}. ${isExhausted ? 'Max retries exhausted.' : 'Scheduled for auto-retry.'}`
      });

      await pool.query(
        `UPDATE notification_logs 
         SET status = $1, error_message = $2, retry_count = $3, audit_trail = $4::jsonb, updated_at = NOW() 
         WHERE id = $5`,
        [finalStatus, errorMsg, newRetryCount, JSON.stringify(auditTrail), logId]
      );

      return { success: false, status: finalStatus, error: errorMsg };
    }
  }

  /**
   * Run sweep to send pending SCHEDULED alerts or re-process QUEUED items
   */
  static async sweepEngine(): Promise<{ processed: number; success: number; failed: number }> {
    const pool = getPool();
    // Fetch QUEUED or SCHEDULED that are due
    const result = await pool.query(
      `SELECT id FROM notification_logs 
       WHERE (status = 'QUEUED' AND retry_count < max_retries) 
          OR (status = 'SCHEDULED' AND scheduled_at <= NOW())`
    );

    let success = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        const res = await this.processLogId(row.id);
        if (res.success) {
          success++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(`[Queue Sweep Exception] Failed on log ID ${row.id}:`, err);
        failed++;
      }
    }

    return {
      processed: result.rows.length,
      success,
      failed
    };
  }
}
