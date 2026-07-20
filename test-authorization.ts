import pg from "pg";
import { verifyPlotAccess } from "./server/routes/inventory.ts";

// Global mock state variables
let mockTenantSubscription: any = null;
let mockPlotRows: any[] = [];
let mockLayoutRows: any[] = [];
let mockProjectRows: any[] = [];
let mockPermissionCount = 0;

// Override pg.Pool.prototype.query to redirect queries to our memory mock driver
(pg.Pool.prototype as any).query = async function (text: string, params?: any[]): Promise<any> {
  const queryTrimmed = text.trim().replace(/\s+/g, " ");

  // 1. Plot check query
  if (queryTrimmed.includes("SELECT p.id, p.plot_number, p.layout_id, l.project_id, prj.tenant_id FROM plots p")) {
    const id = params ? params[0] : null;
    const match = mockPlotRows.find(p => p.id === id);
    return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
  }

  // 2. Layout check query
  if (queryTrimmed.includes("SELECT l.id, l.project_id, prj.tenant_id FROM layouts l")) {
    const id = params ? params[0] : null;
    const match = mockLayoutRows.find(l => l.id === id);
    return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
  }

  // 3. Project check query
  if (queryTrimmed.includes("SELECT id, tenant_id FROM projects WHERE id = $1")) {
    const id = params ? params[0] : null;
    const match = mockProjectRows.find(p => p.id === id);
    return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
  }

  // 4. Tenant Subscription query
  if (queryTrimmed.includes("FROM tenant_subscriptions ts")) {
    return { rows: mockTenantSubscription ? [mockTenantSubscription] : [], rowCount: mockTenantSubscription ? 1 : 0 };
  }

  // 5. Permission / RBAC queries
  if (queryTrimmed.includes("FROM tenant_users tu") && queryTrimmed.includes("role_permissions rp")) {
    return { rows: [{ count: String(mockPermissionCount) }], rowCount: 1 };
  }

  // Fallback default response
  return { rows: [], rowCount: 0 };
};

// Helper to create mocked Express Request and Response objects
function createHttpMocks(options: { user: any; body?: any; params?: any; query?: any }) {
  const req = {
    user: options.user,
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    path: "/plots/edit"
  } as any;

  let statusCode = 200;
  let jsonPayload: any = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      jsonPayload = data;
      return this;
    }
  } as any;

  return { req, res, getStatus: () => statusCode, getPayload: () => jsonPayload };
}

async function runAuthorizationTests() {
  console.log("==================================================================");
  console.log("🛡️  BHOOMIONE V3 SPRINT 6B: PLOT MODULE AUTHENTICATION & SECURITY ");
  console.log("   AUTOMATED INTEGRATION & AUTHORIZATION ASSERTIONS SUITE");
  console.log("==================================================================");

  let successCount = 0;
  let failureCount = 0;

  function assert(testName: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(` ✅ PASS: ${testName}`);
      successCount++;
    } else {
      console.log(` ❌ FAIL: ${testName}`);
      if (details) console.log(`    ↳ Details: ${details}`);
      failureCount++;
    }
  }

  // Define standard test users
  const tenantAOwner = { userId: "user-123", email: "owner@tenant-a.com", tenantId: "tenant-a", role: "DEVELOPER_OWNER" };
  const tenantAEmployee = { userId: "user-456", email: "employee@tenant-a.com", tenantId: "tenant-a", role: "DEVELOPER_USER" };

  // ==========================================================================
  // TEST CASE 1: Active Subscription and Proper Entitlement (Success Path)
  // ==========================================================================
  mockTenantSubscription = { status: "ACTIVE", plan_code: "GROWTH", expires_at: null, access_level: "ENABLED" };
  mockPermissionCount = 1; // has plots.view
  mockPlotRows = [{ id: "plot-1", plot_number: "P-1", layout_id: "layout-1", project_id: "project-1", tenant_id: "tenant-a" }];
  mockLayoutRows = [{ id: "layout-1", project_id: "project-1", tenant_id: "tenant-a" }];
  mockProjectRows = [{ id: "project-1", tenant_id: "tenant-a" }];

  let mocks = createHttpMocks({ user: tenantAOwner, params: { id: "plot-1" } });
  let result = await verifyPlotAccess(mocks.req, mocks.res, "plots.view");
  assert("Test 1: Normal Owner Access (Active Subscription + Entitled + Same Tenant)", result.success === true, `Expected success, got failure`);

  // ==========================================================================
  // TEST CASE 2: Suspended Tenant Subscription (Fail Closed)
  // ==========================================================================
  mockTenantSubscription = { status: "SUSPENDED", plan_code: "GROWTH", expires_at: null, access_level: "ENABLED" };
  mocks = createHttpMocks({ user: tenantAOwner, params: { id: "plot-1" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.view");
  assert("Test 2: Suspended Subscription (Fail Closed)", result.success === false && mocks.getStatus() === 403, `Expected status 403, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 3: Expired Tenant Subscription (Fail Closed)
  // ==========================================================================
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  mockTenantSubscription = { status: "ACTIVE", plan_code: "GROWTH", expires_at: pastDate.toISOString(), access_level: "ENABLED" };
  mocks = createHttpMocks({ user: tenantAOwner, params: { id: "plot-1" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.view");
  assert("Test 3: Expired Subscription (Fail Closed)", result.success === false && mocks.getStatus() === 403, `Expected status 403, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 4: Missing maps.plots Entitlement (Fail Closed)
  // ==========================================================================
  mockTenantSubscription = { status: "ACTIVE", plan_code: "BASIC", expires_at: null, access_level: "DISABLED" };
  mocks = createHttpMocks({ user: tenantAOwner, params: { id: "plot-1" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.view");
  assert("Test 4: Disabled Feature Entitlement (Fail Closed)", result.success === false && mocks.getStatus() === 403, `Expected status 403, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 5: RBAC Insufficient Permissions (Fail Closed)
  // ==========================================================================
  mockTenantSubscription = { status: "ACTIVE", plan_code: "GROWTH", expires_at: null, access_level: "ENABLED" };
  mockPermissionCount = 0; // employee lacks plots.create permission
  mocks = createHttpMocks({ user: tenantAEmployee, params: { id: "plot-1" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.create");
  assert("Test 5: RBAC Insufficient Permissions Check", result.success === false && mocks.getStatus() === 403, `Expected status 403, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 6: Cross-Tenant Project Mismatch (Fail Closed)
  // ==========================================================================
  mockTenantSubscription = { status: "ACTIVE", plan_code: "GROWTH", expires_at: null, access_level: "ENABLED" };
  mockPermissionCount = 1;
  // Project belongs to tenant-b, but user belongs to tenant-a
  mockProjectRows = [{ id: "project-foreign", tenant_id: "tenant-b" }];
  mocks = createHttpMocks({ user: tenantAOwner, body: { project_id: "project-foreign" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.create");
  assert("Test 6: Cross-Tenant Isolation (Project Context Mismatch)", result.success === false && mocks.getStatus() === 404, `Expected status 404, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 7: Cross-Tenant Layout Mismatch (Fail Closed)
  // ==========================================================================
  // Layout belongs to a project owned by tenant-b, user belongs to tenant-a
  mockLayoutRows = [{ id: "layout-foreign", project_id: "project-foreign", tenant_id: "tenant-b" }];
  mocks = createHttpMocks({ user: tenantAOwner, body: { layout_id: "layout-foreign" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.create");
  assert("Test 7: Cross-Tenant Isolation (Layout Context Mismatch)", result.success === false && mocks.getStatus() === 404, `Expected status 404, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 8: Cross-Tenant Plot Mismatch (Fail Closed)
  // ==========================================================================
  // Plot belongs to layout owned by tenant-b, user belongs to tenant-a
  mockPlotRows = [{ id: "plot-foreign", plot_number: "P-F", layout_id: "layout-foreign", project_id: "project-foreign", tenant_id: "tenant-b" }];
  mocks = createHttpMocks({ user: tenantAOwner, params: { id: "plot-foreign" } });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.edit");
  assert("Test 8: Cross-Tenant Isolation (Plot Context Mismatch)", result.success === false && mocks.getStatus() === 404, `Expected status 404, got ${mocks.getStatus()}`);

  // ==========================================================================
  // TEST CASE 9: Dynamic Permission Check - Splitting Plots
  // ==========================================================================
  mockTenantSubscription = { status: "ACTIVE", plan_code: "GROWTH", expires_at: null, access_level: "ENABLED" };
  mockPermissionCount = 1; // has permission
  mockPlotRows = [{ id: "plot-1", plot_number: "P-1", layout_id: "layout-1", project_id: "project-1", tenant_id: "tenant-a" }];
  mockLayoutRows = [{ id: "layout-1", project_id: "project-1", tenant_id: "tenant-a" }];
  // Body has split_from_plot_id metadata
  mocks = createHttpMocks({
    user: tenantAEmployee,
    params: { id: "plot-1" },
    body: { dimensions_metadata: JSON.stringify({ split_from_plot_id: "plot-1" }) }
  });
  result = await verifyPlotAccess(mocks.req, mocks.res, "plots.edit");
  // verifyPlotAccess will check `plots.split` instead of `plots.edit`
  assert("Test 9: Dynamic Action Escalation Detection (plots.split)", result.success === true);

  console.log("==================================================================");
  console.log(`🏁 TESTS COMPLETED: ${successCount} PASSED, ${failureCount} FAILED.`);
  console.log("==================================================================");

  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthorizationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
