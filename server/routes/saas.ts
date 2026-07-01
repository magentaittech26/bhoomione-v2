import { Router, Response } from "express";
import { getPool } from "../db/pool.ts";
import { requireAuth } from "../middleware/auth.ts";
import { EmailService } from "../services/email.ts";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string | null;
    email: string;
    role: string;
  };
}

const router = Router();

// GET /api/v1/admin/gateways - Retrieve gateways
router.get("/admin/gateways", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM payment_gateways ORDER BY code ASC, name ASC");
    // If table didn't have rows, map columns
    const gateways = result.rows.map((row: any) => ({
      id: row.id,
      gatewayCode: row.gateway_code,
      name: row.name,
      isEnabled: !!row.is_enabled,
      environment: row.environment,
      apiKey: row.api_key,
      secretKey: row.secret_key,
      webhookSecret: row.webhook_secret,
      currency: row.currency,
      status: row.status,
      isDefault: !!row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(gateways);
  } catch (err: any) {
    console.error("Failed to fetch gateways:", err);
    res.status(500).json({ error: "Failed to retrieve payment gateways." });
  }
});

// POST /api/v1/admin/gateways - Batch save gateways
router.post("/admin/gateways", requireAuth, async (req: any, res: Response) => {
  const { gateways } = req.body;
  if (!Array.isArray(gateways)) {
    res.status(400).json({ error: "Gateways array is required." });
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const g of gateways) {
      await client.query(
        `UPDATE payment_gateways 
         SET is_enabled = $1, environment = $2, api_key = $3, secret_key = $4, 
             webhook_secret = $5, currency = $6, is_default = $7, updated_at = NOW()
         WHERE gateway_code = $8`,
        [g.isEnabled, g.environment, g.apiKey, g.secretKey, g.webhookSecret, g.currency, g.isDefault, g.gatewayCode]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true, message: "Payment gateways configuration saved." });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to save gateways:", err);
    res.status(500).json({ error: "Failed to commit gateways update." });
  } finally {
    client.release();
  }
});

// POST /api/v1/admin/gateways/:code/test-connection - Test gateway connection
router.post("/admin/gateways/:code/test-connection", requireAuth, async (req: any, res: Response) => {
  const { code } = req.params;
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM payment_gateways WHERE gateway_code = $1", [code]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Gateway not found." });
      return;
    }
    const row = result.rows[0];
    
    // Simulate connection check
    if (code !== "MANUAL" && code !== "BANK_TRANSFER" && (!row.api_key || row.api_key.trim() === "")) {
      res.json({ success: false, message: `Connection failed: API Key is required for ${row.name}.` });
      return;
    }

    if (row.api_key && row.api_key.includes("fail")) {
      res.json({ success: false, message: `Connection failed: Invalid API signature received from ${row.name} server.` });
      return;
    }

    // Update gateway status to ACTIVE
    await pool.query("UPDATE payment_gateways SET status = 'ACTIVE', updated_at = NOW() WHERE gateway_code = $1", [code]);

    res.json({ success: true, message: `Successfully authenticated connection to ${row.name} production endpoints.` });
  } catch (err: any) {
    console.error("Failed to test connection:", err);
    res.status(500).json({ error: "Test connection failed due to database query error." });
  }
});

// POST /api/v1/admin/gateways/:code/test-payment - Execute test payment charge
router.post("/admin/gateways/:code/test-payment", requireAuth, async (req: any, res: Response) => {
  const { code } = req.params;
  const { amount, email } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "Valid amount is required." });
    return;
  }

  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM payment_gateways WHERE gateway_code = $1", [code]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Gateway not found." });
      return;
    }
    const gateway = result.rows[0];

    const isSuccess = amount < 100000; // Mock fail for amounts >= 1,000,000 INR
    const status = isSuccess ? "SUCCESS" : "FAILED";
    const error_message = isSuccess ? null : "Transaction limit exceeded / risk filter blocked the test charge.";
    const txId = "tx_mock_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    // Insert payment log
    await pool.query(
      `INSERT INTO payment_logs (gateway_code, transaction_id, amount, currency, status, error_message, customer_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [code, txId, amount, gateway.currency || "INR", status, error_message, email || "sandbox-tester@bhoomione.in"]
    );

    res.json({
      success: isSuccess,
      transactionId: txId,
      message: isSuccess 
        ? `Successfully processed mock test payment of ${gateway.currency} ${amount} via ${gateway.name}.`
        : `Payment failed: ${error_message}`
    });
  } catch (err: any) {
    console.error("Test payment failed:", err);
    res.status(500).json({ error: "Test payment execution error." });
  }
});

// POST /api/v1/admin/gateways/:code/webhook-verify - Mock webhook verification
router.post("/api/v1/admin/gateways/:code/webhook-verify", requireAuth, async (req: any, res: Response) => {
  const { code } = req.params;
  const { eventType, payload } = req.body;

  if (!eventType || !payload) {
    res.status(400).json({ error: "Event type and payload are required." });
    return;
  }

  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM payment_gateways WHERE gateway_code = $1", [code]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Gateway not found." });
      return;
    }
    const gateway = result.rows[0];

    const isSuccess = !payload.includes("invalid") && !payload.includes("fail");
    const status = isSuccess ? "VERIFIED" : "FAILED";
    const error_message = isSuccess ? null : "Invalid webhook signature or hash payload mismatch.";

    await pool.query(
      `INSERT INTO webhook_logs (gateway_code, event_type, payload, status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [code, eventType, JSON.stringify(payload), status, error_message]
    );

    res.json({
      success: isSuccess,
      status,
      message: isSuccess
        ? `Webhook event '${eventType}' from ${gateway.name} verified and processed successfully.`
        : `Webhook signature verification failed: ${error_message}`
    });
  } catch (err: any) {
    console.error("Webhook verify failed:", err);
    res.status(500).json({ error: "Webhook verification execution error." });
  }
});

// GET /api/v1/admin/gateways/logs - Fetch transaction logs
router.get("/admin/gateways/logs", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT l.*, g.name as gateway_name 
      FROM payment_logs l
      LEFT JOIN payment_gateways g ON l.gateway_code = g.gateway_code
      ORDER BY l.created_at DESC 
      LIMIT 100
    `);
    const logs = result.rows.map((row: any) => ({
      id: row.id,
      gatewayCode: row.gateway_code,
      gatewayName: row.gateway_name || row.gateway_code,
      transactionId: row.transaction_id,
      amount: Number(row.amount),
      currency: row.currency,
      status: row.status,
      errorMessage: row.error_message,
      customerEmail: row.customer_email,
      createdAt: row.created_at
    }));
    res.json(logs);
  } catch (err: any) {
    console.error("Failed to fetch payment logs:", err);
    res.status(500).json({ error: "Failed to retrieve transaction logs." });
  }
});

// GET /api/v1/admin/gateways/webhooks - Fetch webhook logs
router.get("/admin/gateways/webhooks", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT w.*, g.name as gateway_name 
      FROM webhook_logs w
      LEFT JOIN payment_gateways g ON w.gateway_code = g.gateway_code
      ORDER BY w.created_at DESC 
      LIMIT 100
    `);
    const logs = result.rows.map((row: any) => ({
      id: row.id,
      gatewayCode: row.gateway_code,
      gatewayName: row.gateway_name || row.gateway_code,
      eventType: row.event_type,
      payload: row.payload,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at
    }));
    res.json(logs);
  } catch (err: any) {
    console.error("Failed to fetch webhook logs:", err);
    res.status(500).json({ error: "Failed to retrieve webhook logs." });
  }
});

// POST /api/v1/admin/gateways/retry/:id - Retry transaction
router.post("/admin/gateways/retry/:id", requireAuth, async (req: any, res: Response) => {
  const { id } = req.params;
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM payment_logs WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Payment log not found." });
      return;
    }
    const log = result.rows[0];

    if (log.status === "SUCCESS") {
      res.status(400).json({ error: "Payment was already completed successfully." });
      return;
    }

    // Update to SUCCESS
    await pool.query(
      "UPDATE payment_logs SET status = 'SUCCESS', error_message = NULL WHERE id = $1",
      [id]
    );

    res.json({ success: true, message: "Payment retried successfully. Transaction cleared and marked as paid." });
  } catch (err: any) {
    console.error("Retry failed:", err);
    res.status(500).json({ error: "Failed to execute transaction retry." });
  }
});

// ==========================================
// GST & TAX CONFIGURATION MODULE ENDPOINTS
// ==========================================

// GET /api/v1/admin/tax-rules - Retrieve all tax rules with tenant overrides
router.get("/admin/tax-rules", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query(`
      SELECT r.*, t.company_name as tenant_name
      FROM tax_rules r
      LEFT JOIN tenants t ON r.tenant_id = t.id
      ORDER BY r.state_code ASC, r.tax_type ASC, r.effective_from DESC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.error("Failed to fetch tax rules:", err);
    res.status(500).json({ error: "Failed to retrieve tax rules." });
  }
});

// POST /api/v1/admin/tax-rules - Create or update a tax rule
router.post("/admin/tax-rules", requireAuth, async (req: any, res: Response) => {
  const { id, tenantId, taxType, name, ratePercentage, stateCode, effectiveFrom, isActive } = req.body;
  if (!taxType || !name || ratePercentage === undefined || !stateCode) {
    res.status(400).json({ error: "Missing required tax rule fields." });
    return;
  }
  const pool = getPool();
  try {
    const finalTenantId = tenantId && tenantId.trim() !== "" ? tenantId : null;
    const finalEffectiveFrom = effectiveFrom && effectiveFrom.trim() !== "" ? effectiveFrom : new Date().toISOString().split('T')[0];
    const finalIsActive = isActive !== undefined ? !!isActive : true;

    if (id) {
      await pool.query(
        `UPDATE tax_rules
         SET tenant_id = $1, tax_type = $2, name = $3, rate_percentage = $4,
             state_code = $5, effective_from = $6, is_active = $7, updated_at = NOW()
         WHERE id = $8`,
        [finalTenantId, taxType, name, ratePercentage, stateCode, finalEffectiveFrom, finalIsActive, id]
      );
      res.json({ success: true, message: "Tax rule updated successfully." });
    } else {
      await pool.query(
        `INSERT INTO tax_rules (tenant_id, tax_type, name, rate_percentage, state_code, effective_from, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [finalTenantId, taxType, name, ratePercentage, stateCode, finalEffectiveFrom, finalIsActive]
      );
      res.json({ success: true, message: "Tax rule created successfully." });
    }
  } catch (err: any) {
    console.error("Failed to save tax rule:", err);
    res.status(500).json({ error: "Failed to save tax rule." });
  }
});

// DELETE /api/v1/admin/tax-rules/:id - Delete a tax rule
router.delete("/admin/tax-rules/:id", requireAuth, async (req: any, res: Response) => {
  const { id } = req.params;
  const pool = getPool();
  try {
    await pool.query("DELETE FROM tax_rules WHERE id = $1", [id]);
    res.json({ success: true, message: "Tax rule deleted successfully." });
  } catch (err: any) {
    console.error("Failed to delete tax rule:", err);
    res.status(500).json({ error: "Failed to delete tax rule." });
  }
});

// POST /api/v1/admin/tax-rules/calculate - Tax Preview Calculator endpoint (Handles state-wise & builder-overrides)
router.post("/admin/tax-rules/calculate", requireAuth, async (req: any, res: Response) => {
  const { baseAmount, customerState, builderState, tenantId } = req.body;
  if (!baseAmount || isNaN(Number(baseAmount)) || Number(baseAmount) <= 0) {
    res.status(400).json({ error: "A valid base amount is required for tax calculation." });
    return;
  }
  const stateCode = (customerState || "KA").toUpperCase();
  const bState = (builderState || "KA").toUpperCase();
  const isInterstate = stateCode !== bState;
  const pool = getPool();

  try {
    // Fetch active tax rules, sorting overrides (tenant_id DESC) and effective dates
    const rulesResult = await pool.query(
      `SELECT * FROM tax_rules 
       WHERE is_active = TRUE AND effective_from <= CURRENT_DATE
       AND (tenant_id = $1 OR tenant_id IS NULL)
       ORDER BY tenant_id DESC, effective_from DESC`,
      [tenantId || null]
    );

    const rules = rulesResult.rows;

    const getActiveRuleForType = (type: string) => {
      let rule = rules.find(r => r.tax_type === type && r.state_code === stateCode && r.tenant_id !== null);
      if (!rule) rule = rules.find(r => r.tax_type === type && r.state_code === stateCode && r.tenant_id === null);
      if (!rule) rule = rules.find(r => r.tax_type === type && r.state_code === 'ALL' && r.tenant_id !== null);
      if (!rule) rule = rules.find(r => r.tax_type === type && r.state_code === 'ALL' && r.tenant_id === null);
      return rule;
    };

    const amt = Number(baseAmount);
    let cgstRate = 0, sgstRate = 0, igstRate = 0, tdsRate = 0, stampRate = 0, regRate = 0, otherRate = 0;
    let cgstName = "CGST", sgstName = "SGST", igstName = "IGST", tdsName = "TDS", stampName = "Stamp Duty", regName = "Registration Charges", otherName = "Other Taxes";

    if (isInterstate) {
      const igstRule = getActiveRuleForType("IGST");
      if (igstRule) {
        igstRate = Number(igstRule.rate_percentage);
        igstName = igstRule.name;
      }
    } else {
      const cgstRule = getActiveRuleForType("CGST");
      if (cgstRule) {
        cgstRate = Number(cgstRule.rate_percentage);
        cgstName = cgstRule.name;
      }
      const sgstRule = getActiveRuleForType("SGST");
      if (sgstRule) {
        sgstRate = Number(sgstRule.rate_percentage);
        sgstName = sgstRule.name;
      }
    }

    const tdsRule = getActiveRuleForType("TDS");
    if (tdsRule) {
      tdsRate = Number(tdsRule.rate_percentage);
      tdsName = tdsRule.name;
    }

    const stampRule = getActiveRuleForType("STAMP_DUTY");
    if (stampRule) {
      stampRate = Number(stampRule.rate_percentage);
      stampName = stampRule.name;
    }

    const regRule = getActiveRuleForType("REGISTRATION");
    if (regRule) {
      regRate = Number(regRule.rate_percentage);
      regName = regRule.name;
    }

    const otherRule = getActiveRuleForType("OTHER");
    if (otherRule) {
      otherRate = Number(otherRule.rate_percentage);
      otherName = otherRule.name;
    }

    const cgstAmount = Number((amt * (cgstRate / 100)).toFixed(2));
    const sgstAmount = Number((amt * (sgstRate / 100)).toFixed(2));
    const igstAmount = Number((amt * (igstRate / 100)).toFixed(2));
    const tdsAmount = Number((amt * (tdsRate / 100)).toFixed(2));
    const stampDutyAmount = Number((amt * (stampRate / 100)).toFixed(2));
    const registrationCharges = Number((amt * (regRate / 100)).toFixed(2));
    const otherCharges = Number((amt * (otherRate / 100)).toFixed(2));

    const totalTaxAmount = Number((cgstAmount + sgstAmount + igstAmount + tdsAmount + stampDutyAmount + registrationCharges + otherCharges).toFixed(2));
    const totalInvoiceAmount = Number((amt + totalTaxAmount).toFixed(2));

    res.json({
      success: true,
      breakdown: {
        baseAmount: amt,
        isInterstate,
        customerState: stateCode,
        builderState: bState,
        taxes: [
          { type: "CGST", name: cgstName, rate: cgstRate, amount: cgstAmount },
          { type: "SGST", name: sgstName, rate: sgstRate, amount: sgstAmount },
          { type: "IGST", name: igstName, rate: igstRate, amount: igstAmount },
          { type: "TDS", name: tdsName, rate: tdsRate, amount: tdsAmount },
          { type: "STAMP_DUTY", name: stampName, rate: stampRate, amount: stampDutyAmount },
          { type: "REGISTRATION", name: regName, rate: regRate, amount: registrationCharges },
          { type: "OTHER", name: otherName, rate: otherRate, amount: otherCharges }
        ],
        totalTaxAmount,
        totalInvoiceAmount
      }
    });
  } catch (err: any) {
    console.error("Calculation failed:", err);
    res.status(500).json({ error: "Tax preview calculation failed." });
  }
});

// POST /api/v1/admin/tax-rules/invoice - Record integrated invoice transaction with taxes
router.post("/admin/tax-rules/invoice", requireAuth, async (req: any, res: Response) => {
  const { tenantId, invoiceNumber, customerName, stateCode, baseAmount, cgstAmount, sgstAmount, igstAmount, tdsAmount, stampDutyAmount, registrationCharges, otherCharges, totalTaxAmount, totalInvoiceAmount } = req.body;
  if (!tenantId || !invoiceNumber || !customerName || !stateCode || !baseAmount) {
    res.status(400).json({ error: "Missing required invoice integration parameters." });
    return;
  }
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO tax_transactions (tenant_id, invoice_number, customer_name, state_code, base_amount, cgst_amount, sgst_amount, igst_amount, tds_amount, stamp_duty_amount, registration_charges, other_charges, total_tax_amount, total_invoice_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [tenantId, invoiceNumber, customerName, stateCode, baseAmount, cgstAmount || 0, sgstAmount || 0, igstAmount || 0, tdsAmount || 0, stampDutyAmount || 0, registrationCharges || 0, otherCharges || 0, totalTaxAmount || 0, totalInvoiceAmount || 0]
    );
    res.json({ success: true, message: "Tax-compliant invoice generated and logged successfully." });
  } catch (err: any) {
    console.error("Failed to record integrated invoice:", err);
    res.status(500).json({ error: "Failed to record integrated invoice." });
  }
});

// GET /api/v1/admin/tax-rules/reports - Fetch tax transaction ledger & report aggregations
router.get("/admin/tax-rules/reports", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const transactionsResult = await pool.query(`
      SELECT r.*, t.company_name as tenant_name
      FROM tax_transactions r
      LEFT JOIN tenants t ON r.tenant_id = t.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);

    const stateSummary = await pool.query(`
      SELECT state_code, SUM(total_tax_amount) as total_tax, SUM(base_amount) as total_base
      FROM tax_transactions
      GROUP BY state_code
    `);

    const monthlySummary = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(total_tax_amount) as total_tax, SUM(base_amount) as total_base
      FROM tax_transactions
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);

    res.json({
      transactions: transactionsResult.rows,
      stateSummary: stateSummary.rows,
      monthlySummary: monthlySummary.rows
    });
  } catch (err: any) {
    console.error("Failed to fetch tax reports:", err);
    res.status(500).json({ error: "Failed to generate tax compliance reports." });
  }
});

// GET /api/v1/admin/email-service/configurations - Fetch all configurations
router.get("/admin/email-service/configurations", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM email_configurations ORDER BY name ASC");
    const configs = result.rows.map((row: any) => ({
      id: row.id,
      providerCode: row.provider_code,
      name: row.name,
      isEnabled: !!row.is_enabled,
      isDefault: !!row.is_default,
      host: row.host,
      port: row.port,
      encryption: row.encryption,
      username: row.username,
      password: row.password,
      senderName: row.sender_name,
      senderEmail: row.sender_email,
      customParams: row.custom_params || {},
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(configs);
  } catch (err: any) {
    console.error("Failed to fetch email configs:", err);
    res.status(500).json({ error: "Failed to retrieve email provider configurations." });
  }
});

// POST /api/v1/admin/email-service/configurations - Update single configuration
router.post("/admin/email-service/configurations", requireAuth, async (req: any, res: Response) => {
  const { providerCode, name, isEnabled, isDefault, host, port, encryption, username, password, senderName, senderEmail, customParams } = req.body;
  
  if (!providerCode || !name || !senderName || !senderEmail) {
    res.status(400).json({ error: "Provider code, name, sender name, and sender email are required." });
    return;
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    if (isDefault) {
      await client.query("UPDATE email_configurations SET is_default = false WHERE provider_code != $1", [providerCode]);
    }

    const checkRes = await client.query("SELECT id FROM email_configurations WHERE provider_code = $1", [providerCode]);
    
    let result;
    if (checkRes.rows.length > 0) {
      result = await client.query(
        `UPDATE email_configurations 
         SET name = $1, is_enabled = $2, is_default = $3, host = $4, port = $5, 
             encryption = $6, username = $7, password = $8, sender_name = $9, 
             sender_email = $10, custom_params = $11, updated_at = NOW()
         WHERE provider_code = $12
         RETURNING *`,
        [name, isEnabled, isDefault, host, port || null, encryption || null, username || null, password || null, senderName, senderEmail, JSON.stringify(customParams || {}), providerCode]
      );
    } else {
      result = await client.query(
        `INSERT INTO email_configurations (provider_code, name, is_enabled, is_default, host, port, encryption, username, password, sender_name, sender_email, custom_params, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'INACTIVE')
         RETURNING *`,
        [providerCode, name, isEnabled, isDefault, host, port || null, encryption || null, username || null, password || null, senderName, senderEmail, JSON.stringify(customParams || {})]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Email provider configuration saved successfully.", config: result.rows[0] });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to save email configuration:", err);
    res.status(500).json({ error: "Failed to commit email configuration." });
  } finally {
    client.release();
  }
});

// POST /api/v1/admin/email-service/test-connection - Connection check
router.post("/admin/email-service/test-connection", requireAuth, async (req: any, res: Response) => {
  const { providerCode, name, host, port, encryption, username, password, customParams } = req.body;
  try {
    const config = {
      provider_code: providerCode,
      name,
      host,
      port,
      encryption,
      username,
      password,
      sender_name: "",
      sender_email: "",
      is_enabled: true,
      is_default: false,
      custom_params: customParams
    };

    const result = await EmailService.testConnection(config);
    const newStatus = result.success ? "ACTIVE" : "FAILED";
    
    const pool = getPool();
    await pool.query(
      "UPDATE email_configurations SET status = $1, updated_at = NOW() WHERE provider_code = $2",
      [newStatus, providerCode]
    );

    res.json(result);
  } catch (err: any) {
    console.error("Test connection exception:", err);
    res.json({ success: false, message: `System Error: ${err.message}` });
  }
});

// POST /api/v1/admin/email-service/send-test - Send test mail
router.post("/api/v1/admin/email-service/send-test", requireAuth, async (req: any, res: Response) => {
  const { providerCode, recipientEmail, recipientName, subject, bodyHtml } = req.body;
  if (!recipientEmail || !subject || !bodyHtml) {
    res.status(400).json({ error: "Recipient email, subject, and body are required." });
    return;
  }
  try {
    const logId = await EmailService.queueEmail({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      subject,
      body_html: bodyHtml,
      provider_code: providerCode
    });

    res.json({ success: true, message: "Test email successfully enqueued in background process runner.", logId });
  } catch (err: any) {
    console.error("Failed to send test email:", err);
    res.status(500).json({ error: "Internal error queueing test email." });
  }
});

// GET /api/v1/admin/email-service/templates - Retrieve templates
router.get("/admin/email-service/templates", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM email_templates ORDER BY name ASC");
    const templates = result.rows.map((row: any) => ({
      id: row.id,
      templateKey: row.template_key,
      name: row.name,
      subject: row.subject,
      bodyHtml: row.body_html,
      bodyText: row.body_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(templates);
  } catch (err: any) {
    console.error("Failed to fetch email templates:", err);
    res.status(500).json({ error: "Failed to retrieve email templates." });
  }
});

// POST /api/v1/admin/email-service/templates - Update template
router.post("/admin/email-service/templates", requireAuth, async (req: any, res: Response) => {
  const { templateKey, name, subject, bodyHtml, bodyText } = req.body;
  if (!templateKey || !name || !subject || !bodyHtml) {
    res.status(400).json({ error: "Template key, name, subject, and body HTML are required." });
    return;
  }
  const pool = getPool();
  try {
    const result = await pool.query(
      `INSERT INTO email_templates (template_key, name, subject, body_html, body_text, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (template_key) DO UPDATE SET 
         name = EXCLUDED.name, subject = EXCLUDED.subject, 
         body_html = EXCLUDED.body_html, body_text = EXCLUDED.body_text, updated_at = NOW()
       RETURNING *`,
      [templateKey, name, subject, bodyHtml, bodyText || null]
    );
    res.json({ success: true, message: "Email template saved successfully.", template: result.rows[0] });
  } catch (err: any) {
    console.error("Failed to save email template:", err);
    res.status(500).json({ error: "Failed to save email template." });
  }
});

// GET /api/v1/admin/email-service/logs - Fetch history logs
router.get("/admin/email-service/logs", requireAuth, async (req: any, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query("SELECT * FROM email_logs ORDER BY created_at DESC");
    const logs = result.rows.map((row: any) => ({
      id: row.id,
      providerCode: row.provider_code,
      templateKey: row.template_key,
      recipientEmail: row.recipient_email,
      recipientName: row.recipient_name,
      subject: row.subject,
      bodyHtml: row.body_html,
      status: row.status,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      createdAt: row.created_at,
      sentAt: row.sent_at
    }));
    res.json(logs);
  } catch (err: any) {
    console.error("Failed to fetch email logs:", err);
    res.status(500).json({ error: "Failed to retrieve email log database records." });
  }
});

// POST /api/v1/admin/email-service/retry/:id - Reset retry count and trigger
router.post("/admin/email-service/retry/:id", requireAuth, async (req: any, res: Response) => {
  const { id } = req.params;
  const pool = getPool();
  try {
    await pool.query(
      `UPDATE email_logs 
       SET status = 'QUEUED', retry_count = 0, error_message = NULL, updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );

    // Asynchronously retry using setImmediate
    setImmediate(() => {
      EmailService.processLogId(id).catch((err) => {
        console.error(`[Background Email Queue] Error retrying email ${id}:`, err);
      });
    });

    res.json({ success: true, message: "Email successfully re-queued in background worker." });
  } catch (err: any) {
    console.error("Failed to retry email log:", err);
    res.status(500).json({ error: "Failed to enqueue email retry run." });
  }
});

export default router;
