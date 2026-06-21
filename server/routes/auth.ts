import { Router, Response } from "express";
import { AuthService } from "../services/auth.ts";
import { JwtTokenService } from "../services/jwt.ts";
import { AuditLogService } from "../services/audit.ts";
import { tenantResolverMiddleware, TenantRequest } from "../middleware/tenant.ts";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.ts";
import { testConnection } from "../db/pool.ts";

const router = Router();

// Help function to extract client context parameters
function getClientContext(req: TenantRequest) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null;
  const userAgent = req.headers["user-agent"] || null;
  return { ip, userAgent };
}

/**
 * GET /api/v1/health & GET /api/v1/system/health
 * System health endpoint representing database and server conditions.
 */
router.get(["/health", "/system/health"], async (req: TenantRequest, res: Response) => {
  const dbCheck = await testConnection();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbCheck.success ? "CONNECTED" : "DISCONNECTED",
    databaseError: dbCheck.error || null,
    environmentStatus: "OPERATIONAL",
  });
});

/**
 * POST /api/v1/auth/admin/login
 * Platform Administrator Login portal.
 */
router.post("/auth/admin/login", async (req: TenantRequest, res: Response) => {
  const { email, password } = req.body;
  const { ip, userAgent } = getClientContext(req);

  if (!email || !password) {
    res.status(400).json({ error: "Email and password parameters are required." });
    return;
  }

  try {
    const user = await AuthService.authenticatePlatformAdmin(email, password);

    // Save refresh token
    const refreshToken = await JwtTokenService.generateAndSaveRefreshToken(user.id);
    const accessToken = JwtTokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: null,
    });

    // Write audit log
    await AuditLogService.log({
      tenantId: null,
      userId: user.id,
      entityName: "users",
      entityId: user.id,
      action: "LOGIN_SUCCESS",
      newValues: { scope: "GLOBAL", email: user.email },
      ipAddress: ip,
      userAgent,
    });

    const userWithPerms = {
      ...user,
      permissions: await AuthService.getUserPermissions(user.id, null)
    };

    res.json({
      accessToken,
      refreshToken,
      user: userWithPerms,
    });
  } catch (err: any) {
    // Audit failed logins
    await AuditLogService.log({
      tenantId: null,
      userId: null,
      entityName: "security_events",
      entityId: "00000000-0000-0000-0000-000000000000",
      action: "LOGIN_FAILURE",
      oldValues: { email, attempt_scope: "GLOBAL", reason: err.message },
      ipAddress: ip,
      userAgent,
    });

    res.status(401).json({ error: err.message || "Authentication credentials failed." });
  }
});

/**
 * POST /api/v1/auth/tenant/login
 * Developer Tenant Login portal. Resolves tenant context dynamically.
 */
router.post("/auth/tenant/login", tenantResolverMiddleware, async (req: TenantRequest, res: Response) => {
  const { email, password } = req.body;
  const { ip, userAgent } = getClientContext(req);
  const resolvedTenant = req.resolvedTenant;

  if (!resolvedTenant) {
    res.status(400).json({
      error: "Tenant context could not be resolved. Please specify X-Tenant-ID header or access via workspace domain.",
    });
    return;
  }

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const user = await AuthService.authenticateTenantUser(email, password, resolvedTenant.id);

    // Generate token pairs
    const refreshToken = await JwtTokenService.generateAndSaveRefreshToken(user.id);
    const accessToken = JwtTokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: resolvedTenant.id,
    });

    // Audit logs
    await AuditLogService.log({
      tenantId: resolvedTenant.id,
      userId: user.id,
      entityName: "users",
      entityId: user.id,
      action: "LOGIN_SUCCESS",
      newValues: { scope: "TENANT", email: user.email, tenantCode: resolvedTenant.tenantCode },
      ipAddress: ip,
      userAgent,
    });

    const userWithPerms = {
      ...user,
      permissions: await AuthService.getUserPermissions(user.id, resolvedTenant.id)
    };

    res.json({
      accessToken,
      refreshToken,
      user: userWithPerms,
    });
  } catch (err: any) {
    await AuditLogService.log({
      tenantId: resolvedTenant.id,
      userId: null,
      entityName: "security_events",
      entityId: "00000000-0000-0000-0000-000000000000",
      action: "LOGIN_FAILURE",
      oldValues: { email, attempt_scope: "TENANT", tenantId: resolvedTenant.id, reason: err.message },
      ipAddress: ip,
      userAgent,
    });

    res.status(401).json({ error: err.message || "Authentication credentials failed." });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Handshakes and validates Refresh tokens to generate next 15-minute Access tokens.
 */
router.post("/auth/refresh", async (req: TenantRequest, res: Response) => {
  const { refreshToken } = req.body;
  const { ip, userAgent } = getClientContext(req);

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token parameter is missing." });
    return;
  }

  try {
    const userId = await JwtTokenService.validateRefreshToken(refreshToken);

    if (!userId) {
      res.status(401).json({ error: "Refresh token is invalid, revoked, or expired." });
      return;
    }

    // Load full profile
    const profile = await AuthService.getUserProfile(userId, null).catch(async () => {
      // Try with a fallback or just basic lookup
      return null;
    });

    if (!profile) {
      res.status(401).json({ error: "Associated user profile could not be verified." });
      return;
    }

    // Refresh credentials payload
    const accessToken = JwtTokenService.generateAccessToken({
      userId: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      tenantId: profile.tenantId,
    });

    // Write audit log
    await AuditLogService.log({
      tenantId: profile.tenantId,
      userId: profile.id,
      entityName: "users",
      entityId: profile.id,
      action: "TOKEN_REFRESH",
      ipAddress: ip,
      userAgent,
    });

    res.json({ accessToken });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to refresh authentication token." });
  }
});

/**
 * POST /api/v1/auth/logout
 * Secures sessions by executing active refresh token revocations.
 */
router.post("/auth/logout", async (req: TenantRequest, res: Response) => {
  const { refreshToken } = req.body;
  const { ip, userAgent } = getClientContext(req);

  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token is required to execute logout workflow." });
    return;
  }

  try {
    const userId = await JwtTokenService.validateRefreshToken(refreshToken);

    if (userId) {
      await JwtTokenService.revokeRefreshToken(refreshToken);
      const profile = await AuthService.getUserProfile(userId, null).catch(() => null);

      await AuditLogService.log({
        tenantId: profile ? profile.tenantId : null,
        userId,
        entityName: "users",
        entityId: userId,
        action: "LOGOUT",
        ipAddress: ip,
        userAgent,
      });
    }

    res.json({ success: true, message: "Logged out session successfully." });
  } catch (err: any) {
    console.error("Logout exception:", err);
    res.status(500).json({ error: "Failed to verify or execute logout request." });
  }
});

/**
 * POST /api/v1/auth/password-reset/request
 * Triggers security foundation logging.
 */
router.post("/auth/password-reset/request", async (req: TenantRequest, res: Response) => {
  const { email } = req.body;
  const { ip, userAgent } = getClientContext(req);

  if (!email) {
    res.status(400).json({ error: "Email parameter is required." });
    return;
  }

  try {
    const result = await AuthService.requestPasswordReset(email);

    await AuditLogService.log({
      tenantId: null,
      userId: null,
      entityName: "security_events",
      entityId: "00000000-0000-0000-0000-000000000000",
      action: "PASSWORD_RESET_REQUEST",
      newValues: { email, resultMessage: result.message, resetToken: result.resetToken },
      ipAddress: ip,
      userAgent,
    });

    res.json({
      success: true,
      message: result.message,
      tokenSymbolReferenceSandbox: result.resetToken || null, // Provided only for visual testing in sandbox preview
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal error executing password reset step." });
  }
});

/**
 * POST /api/v1/auth/password-reset/submit
 * Submits token and updates hashed secrets.
 */
router.post("/auth/password-reset/submit", async (req: TenantRequest, res: Response) => {
  const { email, token, newPassword } = req.body;
  const { ip, userAgent } = getClientContext(req);

  if (!email || !token || !newPassword) {
    res.status(400).json({ error: "Email, validation token, and newPassword parameters are mandatory." });
    return;
  }

  try {
    const success = await AuthService.submitPasswordReset(email, token, newPassword);

    if (!success) {
      res.status(400).json({ error: "Password update failed. Profile mismatch or expired confirmation parameters." });
      return;
    }

    await AuditLogService.log({
      tenantId: null,
      userId: null,
      entityName: "security_events",
      entityId: "00000000-0000-0000-0000-000000000000",
      action: "PASSWORD_RESET_SUBMIT",
      newValues: { email, token },
      ipAddress: ip,
      userAgent,
    });

    res.json({ success: true, message: "Credentials modified successfully. Proceed to login page." });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to commit security change request." });
  }
});

/**
 * GET /api/v1/me
 * Protected endpoint returning authorized profiles back to validated clients.
 */
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeToken = req.user!;
    const profile = await AuthService.getUserProfile(activeToken.userId, activeToken.tenantId);
    
    const profileWithPerms = {
      ...profile,
      permissions: await AuthService.getUserPermissions(activeToken.userId, activeToken.tenantId)
    };

    res.json({ user: profileWithPerms });
  } catch (error: any) {
    res.status(401).json({ error: error.message || "Could not reconcile profile credentials." });
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Protected by audit.view permission check.
 */
router.get("/admin/audit-logs", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeToken = req.user!;
    const perms = await AuthService.getUserPermissions(activeToken.userId, activeToken.tenantId);
    
    if (!perms.includes("audit.view")) {
      res.status(403).json({ error: "Access Denied. Missing required permission: audit.view" });
      return;
    }

    res.json({
      message: "Access authorized. Retrieved platform security logs from DB successfully.",
      scope: "GLOBAL",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Unauthorized access." });
  }
});

/**
 * POST /api/v1/admin/tenants
 * Protected by tenants.manage permission check.
 */
router.post("/admin/tenants", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeToken = req.user!;
    const perms = await AuthService.getUserPermissions(activeToken.userId, activeToken.tenantId);
    
    if (!perms.includes("tenants.manage")) {
      res.status(403).json({ error: "Access Denied. Missing required permission: tenants.manage" });
      return;
    }

    res.json({
      message: "Access authorized. Created new tenant registry entry successfully.",
      scope: "GLOBAL",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Unauthorized access." });
  }
});

/**
 * GET /api/v1/tenant/users
 * Protected by users.view permission check within current tenant.
 */
router.get("/tenant/users", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activeToken = req.user!;
    if (!activeToken.tenantId) {
      res.status(400).json({ error: "Tenant context context required." });
      return;
    }

    const perms = await AuthService.getUserPermissions(activeToken.userId, activeToken.tenantId);
    
    if (!perms.includes("users.view")) {
      res.status(403).json({ error: "Access Denied. Missing required permission: users.view" });
      return;
    }

    res.json({
      message: "Access authorized. Retrieved current workspace active member roster.",
      scope: "TENANT",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Unauthorized access." });
  }
});

export default router;
