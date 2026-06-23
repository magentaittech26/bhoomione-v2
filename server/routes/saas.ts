import { Router, Response } from "express";
import { getPool } from "../db/pool.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";

const router = Router();

/**
 * GET /api/v1/admin/modules
 * Retrieves all registered modules and their sub-features from PostgreSQL relational tables.
 */
router.get("/admin/modules", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPool();
    const modulesRes = await pool.query(
      `SELECT id, code, name, "group", description, status, is_core, is_billable, sort_order 
       FROM saas_modules 
       ORDER BY sort_order, name`
    );
    const featuresRes = await pool.query(
      `SELECT id, module_id, code, name, "group", description, status, default_enabled 
       FROM saas_features 
       ORDER BY name`
    );

    const modules = modulesRes.rows.map(m => {
      return {
        id: m.id,
        code: m.code,
        name: m.name,
        group: m.group,
        description: m.description,
        status: m.status,
        isCore: m.is_core,
        isBillable: m.is_billable,
        sortOrder: m.sort_order,
        features: featuresRes.rows
          .filter(f => f.module_id === m.id)
          .map(f => ({
            id: f.id,
            code: f.code,
            name: f.name,
            group: f.group,
            description: f.description,
            status: f.status,
            defaultEnabled: f.default_enabled
          }))
      };
    });

    res.json(modules);
  } catch (err: any) {
    console.error("GET /admin/modules Error:", err);
    res.status(500).json({ error: "Failed to load registered SaaS modules." });
  }
});

/**
 * GET /api/v1/admin/plans
 * Retrieves subscription plans with nested limits and feature access records.
 */
router.get("/admin/plans", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPool();
    const plansRes = await pool.query(
      `SELECT id, plan_code, name, monthly_rate, yearly_rate, trial_days, status, sort_order 
       FROM subscription_plans 
       ORDER BY sort_order, name`
    );
    const limitsRes = await pool.query(
      `SELECT plan_id, limit_key, limit_value FROM subscription_plan_limits`
    );
    const featuresRes = await pool.query(
      `SELECT splf.plan_id, sf.code as feature_code, splf.access_level 
       FROM subscription_plan_features splf
       JOIN saas_features sf ON splf.feature_id = sf.id`
    );

    const plans = plansRes.rows.map(p => {
      // Build limits map
      const limits: Record<string, number> = {};
      limitsRes.rows
        .filter(l => l.plan_id === p.id)
        .forEach(l => {
          limits[l.limit_key] = l.limit_value;
        });

      // Build features map
      const features: Record<string, string> = {};
      featuresRes.rows
        .filter(f => f.plan_id === p.id)
        .forEach(f => {
          features[f.feature_code] = f.access_level;
        });

      return {
        id: p.id,
        plan_code: p.plan_code,
        name: p.name,
        monthly_price: Number(p.monthly_rate),
        yearly_price: Number(p.yearly_rate),
        trial_days: p.trial_days || 14,
        status: p.status || "ACTIVE",
        sort_order: p.sort_order || 1,
        limits,
        features
      };
    });

    res.json(plans);
  } catch (err: any) {
    console.error("GET /admin/plans Error:", err);
    res.status(500).json({ error: "Failed to load SaaS subscription plans." });
  }
});

/**
 * POST /api/v1/admin/plans
 * Creates or updates a subscription plan and its limits/feature matrix mapping.
 */
router.post("/admin/plans", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id, plan_code, name, monthly_price, yearly_price, trial_days, status, sort_order, limits, features } = req.body;

  if (!plan_code || !name) {
    res.status(400).json({ error: "Plan code and name parameters are required." });
    return;
  }

  const pool = getPool();
  try {
    await pool.query("BEGIN");

    let planId = id;
    if (planId) {
      // Update existing
      await pool.query(
        `UPDATE subscription_plans 
         SET name = $1, monthly_rate = $2, yearly_rate = $3, monthly_price = $2, yearly_price = $3, trial_days = $4, status = $5, sort_order = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [name, monthly_price, yearly_price, trial_days, status, sort_order, planId]
      );
    } else {
      // Insert new
      const insertRes = await pool.query(
        `INSERT INTO subscription_plans (plan_code, name, monthly_rate, yearly_rate, monthly_price, yearly_price, trial_days, status, sort_order)
         VALUES ($1, $2, $3, $4, $3, $4, $5, $6, $7)
         RETURNING id`,
        [plan_code, name, monthly_price, yearly_price, trial_days || 14, status || "ACTIVE", sort_order || 1]
      );
      planId = insertRes.rows[0].id;
    }

    // Save limits
    if (limits && typeof limits === "object") {
      await pool.query(`DELETE FROM subscription_plan_limits WHERE plan_id = $1`, [planId]);
      for (const [key, val] of Object.entries(limits)) {
        await pool.query(
          `INSERT INTO subscription_plan_limits (plan_id, limit_key, limit_value)
           VALUES ($1, $2, $3)`,
          [planId, key, Number(val)]
        );
      }
    }

    // Save features matrix
    if (features && typeof features === "object") {
      await pool.query(`DELETE FROM subscription_plan_features WHERE plan_id = $1`, [planId]);
      // Look up saas_features list for mapping keys to IDs
      const featsRes = await pool.query(`SELECT id, code FROM saas_features`);
      const keyMap: Record<string, string> = {};
      featsRes.rows.forEach(f => {
        keyMap[f.code] = f.id;
      });

      for (const [fCode, level] of Object.entries(features)) {
        const featureId = keyMap[fCode];
        if (featureId) {
          await pool.query(
            `INSERT INTO subscription_plan_features (plan_id, feature_id, access_level)
             VALUES ($1, $2, $3)`,
            [planId, featureId, level]
          );
        }
      }
    }

    await pool.query("COMMIT");
    res.json({ success: true, id: planId, message: "Subscription plan updated successfully." });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("POST /admin/plans Error:", err);
    res.status(500).json({ error: "Failed to persist subscription plan to relational database." });
  }
});

/**
 * GET /api/v1/admin/addons
 * Retrieves all platform billing addons.
 */
router.get("/admin/addons", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPool();
    const resAddons = await pool.query(
      `SELECT id, code, name, monthly_price, yearly_price, description, status 
       FROM subscription_addons 
       ORDER BY code`
    );

    const addons = resAddons.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      monthlyPrice: Number(row.monthly_price),
      yearlyPrice: Number(row.yearly_price),
      description: row.description,
      status: row.status
    }));

    res.json(addons);
  } catch (err: any) {
    console.error("GET /admin/addons Error:", err);
    res.status(500).json({ error: "Failed to fetch subscription addons list." });
  }
});

/**
 * POST /api/v1/admin/addons
 * Creates or updates a platform billing addon.
 */
router.post("/admin/addons", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id, code, name, monthlyPrice, yearlyPrice, description, status } = req.body;

  if (!code || !name) {
    res.status(400).json({ error: "Addon code and name parameters are required." });
    return;
  }

  const pool = getPool();
  try {
    if (id) {
      await pool.query(
        `UPDATE subscription_addons 
         SET name = $1, monthly_price = $2, yearly_price = $3, description = $4, status = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [name, monthlyPrice, yearlyPrice, description, status, id]
      );
    } else {
      await pool.query(
        `INSERT INTO subscription_addons (code, name, monthly_price, yearly_price, description, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [code, name, monthlyPrice, yearlyPrice, description, status || "ACTIVE"]
      );
    }
    res.json({ success: true, message: "Addon saved successfully." });
  } catch (err: any) {
    console.error("POST /admin/addons Error:", err);
    res.status(500).json({ error: "Failed to persist subscription addon." });
  }
});

/**
 * GET /api/v1/admin/slabs
 * Retrieves plot billing slabs.
 */
router.get("/admin/slabs", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPool();
    const resSlabs = await pool.query(
      `SELECT id, 
              min_plots as "minPlots", 
              max_plots as "maxPlots", 
              monthly_price as "monthlyPrice", 
              yearly_price as "yearlyPrice", 
              one_time_license_price as "oneTimeLicensePrice",
              amc_price as "amcPrice",
              sort_order as "sortOrder",
              status 
       FROM subscription_plot_slabs 
       ORDER BY sort_order ASC, min_plots ASC`
    );
    res.json(resSlabs.rows);
  } catch (err: any) {
    console.error("GET /admin/slabs Error:", err);
    res.status(500).json({ error: "Failed to load plot billing slabs." });
  }
});

/**
 * POST /api/v1/admin/slabs
 * Adds or edits a plot billing slab.
 */
router.post("/admin/slabs", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id, minPlots, maxPlots, monthlyPrice, yearlyPrice, oneTimeLicensePrice, amcPrice, sortOrder, status } = req.body;

  const pool = getPool();
  try {
    if (id) {
      await pool.query(
        `UPDATE subscription_plot_slabs 
         SET min_plots = $1, max_plots = $2, monthly_price = $3, yearly_price = $4, 
             one_time_license_price = $5, amc_price = $6, sort_order = $7, status = $8, updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [minPlots, maxPlots, monthlyPrice, yearlyPrice, oneTimeLicensePrice || 0.00, amcPrice || 0.00, sortOrder || 0, status, id]
      );
    } else {
      await pool.query(
        `INSERT INTO subscription_plot_slabs (min_plots, max_plots, monthly_price, yearly_price, one_time_license_price, amc_price, sort_order, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [minPlots, maxPlots, monthlyPrice, yearlyPrice, oneTimeLicensePrice || 0.00, amcPrice || 0.00, sortOrder || 0, status || "ACTIVE"]
      );
    }
    res.json({ success: true, message: "Plot billing slab saved successfully." });
  } catch (err: any) {
    console.error("POST /admin/slabs Error:", err);
    res.status(500).json({ error: "Failed to persist plot billing slab." });
  }
});

/**
 * DELETE /api/v1/admin/slabs/:id
 * Deletes a plot billing slab only if unused by any tenant's plot density.
 */
router.delete("/admin/slabs/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const slabId = req.params.id;
  const pool = getPool();
  try {
    // 1. Get the slab details
    const slabRes = await pool.query(`SELECT * FROM subscription_plot_slabs WHERE id = $1`, [slabId]);
    if (slabRes.rowCount === 0) {
      return res.status(404).json({ error: "Slab not found." });
    }
    const slab = slabRes.rows[0];

    // 2. For each tenant, fetch plot count and check if it falls in slab's range
    const tenantsRes = await pool.query(`SELECT id, company_name as "companyName", tenant_code as "tenantCode" FROM tenants`);
    for (const t of tenantsRes.rows) {
      const plotCountRes = await pool.query(
        `SELECT COUNT(*)::integer as count 
         FROM plots p
         JOIN layouts l ON p.layout_id = l.id
         JOIN projects pr ON l.project_id = pr.id
         WHERE pr.tenant_id = $1`,
        [t.id]
      );
      const plotsCount = plotCountRes.rows[0].count;
      if (plotsCount >= slab.min_plots && plotsCount <= slab.max_plots) {
        return res.status(400).json({
          error: `Cannot delete this slab: Tenant ${t.companyName} (${t.tenantCode}) has ${plotsCount} plots, which falls within this slab range.`
        });
      }
    }

    // 3. Perform the delete
    await pool.query(`DELETE FROM subscription_plot_slabs WHERE id = $1`, [slabId]);
    res.json({ success: true, message: "Plot billing slab deleted successfully." });
  } catch (err: any) {
    console.error("DELETE /admin/slabs Error:", err);
    res.status(500).json({ error: "Failed to delete plot billing slab." });
  }
});

/**
 * POST /api/v1/admin/slabs/reorder
 * Reorders plot billing slabs.
 */
router.post("/admin/slabs/reorder", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: "ids array is required." });
  }

  const pool = getPool();
  try {
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      await pool.query(
        `UPDATE subscription_plot_slabs SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [index, id]
      );
    }
    res.json({ success: true, message: "Slabs reordered successfully." });
  } catch (err: any) {
    console.error("POST /admin/slabs/reorder Error:", err);
    res.status(500).json({ error: "Failed to reorder slabs." });
  }
});

/**
 * GET /api/v1/admin/settings
 * Retrieves all SaaS platform settings.
 */
router.get("/admin/settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pool = getPool();
    const settingsRes = await pool.query(
      `SELECT id, 
              setting_group as "settingGroup", 
              setting_key as "settingKey", 
              setting_value as "settingValue", 
              setting_type as "settingType", 
              is_public as "isPublic" 
       FROM saas_platform_settings`
    );
    res.json(settingsRes.rows);
  } catch (err: any) {
    console.error("GET /admin/settings Error:", err);
    res.status(500).json({ error: "Failed to load SaaS platform settings." });
  }
});

/**
 * POST /api/v1/admin/settings
 * Saves a batch of platform settings.
 */
router.post("/admin/settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { settings } = req.body;
  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: "settings array is required." });
  }

  const pool = getPool();
  try {
    for (const s of settings) {
      if (!s.settingKey || !s.settingGroup) continue;
      
      const checkRes = await pool.query(`SELECT id FROM saas_platform_settings WHERE setting_key = $1`, [s.settingKey]);
      if (checkRes.rowCount > 0) {
        await pool.query(
          `UPDATE saas_platform_settings 
           SET setting_group = $1, setting_value = $2, setting_type = $3, is_public = $4, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = $5`,
          [s.settingGroup, s.settingValue !== undefined ? String(s.settingValue) : null, s.settingType || "string", s.isPublic || false, s.settingKey]
        );
      } else {
        await pool.query(
          `INSERT INTO saas_platform_settings (setting_group, setting_key, setting_value, setting_type, is_public)
           VALUES ($1, $2, $3, $4, $5)`,
          [s.settingGroup, s.settingKey, s.settingValue !== undefined ? String(s.settingValue) : null, s.settingType || "string", s.isPublic || false]
        );
      }
    }
    res.json({ success: true, message: "SaaS platform settings saved successfully." });
  } catch (err: any) {
    console.error("POST /admin/settings Error:", err);
    res.status(500).json({ error: "Failed to persist SaaS platform settings." });
  }
});

/**
 * GET /api/v1/admin/tenants/:id/subscription
 * Retrieves a tenant's complete subscription status profile.
 */
router.get("/admin/tenants/:id/subscription", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantLookupVal = req.params.id;

  const pool = getPool();
  try {
    // 1. Resolve Tenant ID if passed tenant_code or id (UUID)
    const tenantRes = await pool.query(
      `SELECT id, tenant_code, company_name FROM tenants WHERE id::text = $1 OR tenant_code = $1 LIMIT 1`,
      [tenantLookupVal]
    );

    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Tenant not found." });
      return;
    }

    const tenant = tenantRes.rows[0];
    const tenantId = tenant.id;

    // 2. Load Subscription
    const subRes = await pool.query(
      `SELECT ts.id, ts.tenant_id, ts.plan_id, ts.status, 
              ts.subscription_start_date, ts.subscription_expiry_date, ts.trial_expiry_date, ts.renewal_date,
              sp.plan_code, sp.name as plan_name, sp.monthly_rate, sp.yearly_rate, sp.sort_order
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ts.tenant_id = $1 LIMIT 1`,
      [tenantId]
    );

    if (subRes.rows.length === 0) {
      // Default baseline virtual trial starter plan profile
      const defaultPlanRes = await pool.query(`SELECT id, plan_code, name FROM subscription_plans WHERE plan_code = 'STARTER' LIMIT 1`);
      const defaultPlan = defaultPlanRes.rows[0] || null;

      res.json({
        has_subscription: false,
        status: "PENDING_SUBSCRIPTION",
        plan_id: defaultPlan ? defaultPlan.id : null,
        plan: defaultPlan ? { id: defaultPlan.id, plan_code: defaultPlan.plan_code, name: defaultPlan.name } : null,
        addons: [],
        feature_overrides: [],
        limit_overrides: []
      });
      return;
    }

    const sub = subRes.rows[0];

    // 3. Load Addons
    const addonsRes = await pool.query(
      `SELECT ta.id, ta.addon_id, sa.code, sa.name, sa.description, sa.monthly_price, sa.yearly_price 
       FROM tenant_addons ta
       JOIN subscription_addons sa ON ta.addon_id = sa.id
       WHERE ta.tenant_subscription_id = $1`,
      [sub.id]
    );

    // 4. Load feature overrides
    const featOverridesRes = await pool.query(
      `SELECT tfo.id, tfo.feature_id, sf.code as feature_code, tfo.override_status
       FROM tenant_feature_overrides tfo
       JOIN saas_features sf ON tfo.feature_id = sf.id
       WHERE tfo.tenant_subscription_id = $1`,
      [sub.id]
    );

    // 5. Load limit overrides
    const limitOverridesRes = await pool.query(
      `SELECT id, limit_key, override_value 
       FROM tenant_limit_overrides 
       WHERE tenant_subscription_id = $1`,
      [sub.id]
    );

    // Construct profile matching Laravel service structure
    res.json({
      has_subscription: true,
      id: sub.id,
      tenant_id: sub.tenant_id,
      plan_id: sub.plan_id,
      status: sub.status,
      subscription_start_date: sub.subscription_start_date ? sub.subscription_start_date : new Date().toISOString().split("T")[0],
      subscription_expiry_date: sub.subscription_expiry_date ? sub.subscription_expiry_date : new Date().toISOString().split("T")[0],
      trial_expiry_date: sub.trial_expiry_date || null,
      renewal_date: sub.renewal_date || null,
      plan: {
        id: sub.plan_id,
        plan_code: sub.plan_code,
        name: sub.plan_name,
        monthly_price: Number(sub.monthly_rate),
        yearly_price: Number(sub.yearly_rate),
        sort_order: sub.sort_order
      },
      addons: addonsRes.rows.map(a => ({
        id: a.id,
        addon_id: a.addon_id,
        addon: {
          id: a.addon_id,
          code: a.code,
          name: a.name,
          description: a.description,
          monthly_price: Number(a.monthly_price),
          yearly_price: Number(a.yearly_price)
        }
      })),
      feature_overrides: featOverridesRes.rows.map(fo => ({
        id: fo.id,
        feature_id: fo.feature_id,
        override_status: fo.override_status,
        feature: {
          id: fo.feature_id,
          code: fo.feature_code
        }
      })),
      limit_overrides: limitOverridesRes.rows.map(lo => ({
        id: lo.id,
        limit_key: lo.limit_key,
        override_value: lo.override_value
      })),
      billing_override: null
    });
  } catch (err: any) {
    console.error("GET /admin/tenants/:id/subscription Error:", err);
    res.status(500).json({ error: "Failed to fetch tenant subscription profile." });
  }
});

/**
 * POST /api/v1/admin/tenants/:id/subscription
 * Assigns or changes plan subscription for a tenant.
 */
router.post("/admin/tenants/:id/subscription", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantLookupVal = req.params.id;
  const { plan_id, start_date, billing_period, trial_days, status } = req.body;

  if (!plan_id) {
    res.status(400).json({ error: "Plan ID parameter is required." });
    return;
  }

  const pool = getPool();
  try {
    await pool.query("BEGIN");

    // Resolve tenant
    const tenantRes = await pool.query(
      `SELECT id FROM tenants WHERE id::text = $1 OR tenant_code = $1 LIMIT 1`,
      [tenantLookupVal]
    );
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Tenant not found." });
      return;
    }
    const tenantId = tenantRes.rows[0].id;

    // Resolve plan
    const planRes = await pool.query(`SELECT id FROM subscription_plans WHERE id = $1`, [plan_id]);
    if (planRes.rows.length === 0) {
      res.status(404).json({ error: "Subscription plan not found." });
      return;
    }

    const startDate = start_date || new Date().toISOString().split("T")[0];
    const months = billing_period === "YEARLY" ? 12 : 1;
    const expDate = new Date(startDate);
    expDate.setMonth(expDate.getMonth() + months);
    const subscriptionExpiryDate = expDate.toISOString().split("T")[0];

    const trialExpDate = trial_days
      ? (() => {
          const tDate = new Date(startDate);
          tDate.setDate(tDate.getDate() + Number(trial_days));
          return tDate.toISOString().split("T")[0];
        })()
      : null;

    // Check if subscription exists
    const subQuery = await pool.query(`SELECT id FROM tenant_subscriptions WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    if (subQuery.rows.length > 0) {
      // Update
      const subId = subQuery.rows[0].id;
      await pool.query(
        `UPDATE tenant_subscriptions 
         SET plan_id = $1, status = $2, subscription_start_date = $3, subscription_expiry_date = $4, expires_at = $5, trial_expiry_date = $6, renewal_date = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [plan_id, status || "ACTIVE", startDate, subscriptionExpiryDate, expDate, trialExpDate, subscriptionExpiryDate, subId]
      );
    } else {
      // Insert
      await pool.query(
        `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, subscription_start_date, subscription_expiry_date, expires_at, trial_expiry_date, renewal_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tenantId, plan_id, status || "ACTIVE", startDate, subscriptionExpiryDate, expDate, trialExpDate, subscriptionExpiryDate]
      );
    }

    await pool.query("COMMIT");
    res.json({ success: true, message: "Subscription plan assigned to tenant." });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("POST /admin/tenants/:id/subscription Error:", err);
    res.status(500).json({ error: "Failed to assign tenant subscription." });
  }
});

/**
 * POST /api/v1/admin/tenants/:id/subscription/lifecycle
 * Mutates tenant subscription status.
 */
router.post("/admin/tenants/:id/subscription/lifecycle", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tenantLookupVal = req.params.id;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: "Status parameter is required." });
    return;
  }

  const pool = getPool();
  try {
    // Resolve tenant
    const tenantRes = await pool.query(
      `SELECT id FROM tenants WHERE id::text = $1 OR tenant_code = $1 LIMIT 1`,
      [tenantLookupVal]
    );
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Tenant not found." });
      return;
    }
    const tenantId = tenantRes.rows[0].id;

    await pool.query(
      `UPDATE tenant_subscriptions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $2`,
      [status.toUpperCase(), tenantId]
    );

    res.json({ success: true, message: `Subscription status set to ${status}.` });
  } catch (err: any) {
    console.error("POST /admin/tenants/:id/subscription/lifecycle Error:", err);
    res.status(500).json({ error: "Failed to update subscription lifecycle status." });
  }
});

export default router;
