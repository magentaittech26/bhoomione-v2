import { AuthResponse, UserProfile, SystemHealth } from "../types/auth.ts";

class ApiClient {
  private baseUri = ((import.meta as any).env?.VITE_LARAVEL_API_URL || "/api/v1").replace(/\/$/, "");

  // Get tokens from sessionStorage to survive iframe reloads
  getAccessToken(): string | null {
    return sessionStorage.getItem("bhoomi_access_token");
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem("bhoomi_refresh_token");
  }

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem("bhoomi_access_token", accessToken);
    sessionStorage.setItem("bhoomi_refresh_token", refreshToken);
  }

  clearTokens(): void {
    sessionStorage.removeItem("bhoomi_access_token");
    sessionStorage.removeItem("bhoomi_refresh_token");
    sessionStorage.removeItem("bhoomi_user_profile");
  }

  getCurrentUser(): UserProfile | null {
    const raw = sessionStorage.getItem("bhoomi_user_profile");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: UserProfile): void {
    sessionStorage.setItem("bhoomi_user_profile", JSON.stringify(user));
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    tenantId?: string | null
  ): Promise<T> {
    const url = `${this.baseUri}${endpoint}`;
    const headers = new Headers(options.headers || {});

    // Set JSON payload headers
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Inject Bearer Token
    const token = this.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Inject X-Tenant-ID
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const user = this.getCurrentUser();
      if (user) {
        finalTenantId = user.tenantId || user.tenantCode || null;
      }
    }
    if (finalTenantId) {
      headers.set("x-tenant-id", finalTenantId);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    // If unauthorized, attempt transparent refresh token handshake
    if (response.status === 401) {
      const refresh = this.getRefreshToken();
      if (refresh) {
        console.log("🔄 Access token expired. Attempting token refresh handshake...");
        try {
          const refreshRes = await fetch(`${this.baseUri}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refresh }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            this.setTokens(data.accessToken, refresh);
            headers.set("Authorization", `Bearer ${data.accessToken}`);
            
            // Retry the original request
            response = await fetch(url, { ...options, headers });
          } else {
            console.warn("⚠️ Refresh token invalid or expired. Terminating session.");
            this.clearTokens();
          }
        } catch (err) {
          console.error("Token refresh routing failed:", err);
          this.clearTokens();
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  async testSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(`${this.baseUri}/system/health`);
    if (!response.ok) {
      throw new Error("System health check returned warning status.");
    }
    return response.json();
  }

  async loginAdmin(payload: Record<string, string>): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    this.setCurrentUser(data.user);
    return data;
  }

  async loginTenant(payload: Record<string, string>, tenantCodeOrId: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>(
      "/auth/tenant/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      tenantCodeOrId
    );
    this.setTokens(data.accessToken, data.refreshToken);
    this.setCurrentUser(data.user);
    return data;
  }

  async logout(): Promise<void> {
    const refresh = this.getRefreshToken();
    if (refresh) {
      try {
        await fetch(`${this.baseUri}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
      } catch (err) {
        console.error("Logout network notification neglected:", err);
      }
    }
    this.clearTokens();
  }

  async fetchMyProfile(): Promise<{ user: UserProfile }> {
    const data = await this.request<{ user: UserProfile }>("/me");
    this.setCurrentUser(data.user);
    return data;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; tokenSymbolReferenceSandbox?: string }> {
    return this.request<{ success: boolean; message: string; tokenSymbolReferenceSandbox?: string }>(
      "/auth/password-reset/request",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      }
    );
  }

  async submitPasswordReset(payload: Record<string, string>): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/auth/password-reset/submit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async fetchAdminAuditLogs(params?: {
    action?: string;
    operator?: string;
    target?: string;
    date_from?: string;
    date_to?: string;
    hide_noise?: boolean;
    limit?: number;
    page?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          query.append(key, String(val));
        }
      });
    }
    const queryString = query.toString();
    const url = `/admin/audit-logs${queryString ? `?${queryString}` : ""}`;
    return this.request<any>(url, {
      method: "GET"
    });
  }

  async fetchSaasModules(): Promise<any[]> {
    return this.request<any[]>("/admin/modules", {
      method: "GET"
    });
  }

  async fetchSaasFeatures(): Promise<any[]> {
    return this.request<any[]>("/admin/features", {
      method: "GET"
    });
  }

  async fetchSaasPlans(): Promise<any[]> {
    return this.request<any[]>("/admin/plans", {
      method: "GET"
    });
  }

  async saveSaasPlan(payload: any): Promise<{ success: boolean; id?: string; message: string }> {
    return this.request<{ success: boolean; id?: string; message: string }>("/admin/plans", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async saveSaasModule(payload: any): Promise<any> {
    return this.request<any>("/admin/modules", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async saveSaasFeature(payload: any): Promise<any> {
    return this.request<any>("/admin/features", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async fetchSaasAddons(): Promise<any[]> {
    return this.request<any[]>("/admin/addons", {
      method: "GET"
    });
  }

  async saveSaasAddon(payload: any): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/admin/addons", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async fetchSaasSlabs(): Promise<any[]> {
    return this.request<any[]>("/admin/slabs", {
      method: "GET"
    });
  }

  async saveSaasSlab(payload: any): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/admin/slabs", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async deleteSaasSlab(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/slabs/${id}`, {
      method: "DELETE"
    });
  }

  async reorderSaasSlabs(ids: string[]): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/admin/slabs/reorder", {
      method: "POST",
      body: JSON.stringify({ ids })
    });
  }

  async fetchSaasSettings(): Promise<any[]> {
    return this.request<any[]>("/admin/settings", {
      method: "GET"
    });
  }

  async saveSaasSettings(settings: any[]): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>("/admin/settings", {
      method: "POST",
      body: JSON.stringify({ settings })
    });
  }

  async fetchTenantSubscription(id: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/subscription`, {
      method: "GET"
    });
  }

  async assignTenantPlan(id: string, payload: any): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/subscription`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async updateTenantLifecycle(id: string, status: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/tenants/${id}/subscription/lifecycle`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
  }

  async saveTenantOverrides(id: string, payload: any): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/tenants/${id}/subscription/overrides`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  // ==========================================
  // PHASE 1F.2 TENANT OPERATIONS SYSTEM API
  // ==========================================

  async fetchTenants(): Promise<any[]> {
    return this.request<any[]>("/admin/tenants", {
      method: "GET"
    });
  }

  async fetchProvisioningLogs(): Promise<any[]> {
    return this.request<any[]>("/admin/tenants/logs", {
      method: "GET"
    });
  }

  async fetchLifecycleEvents(id: string): Promise<any[]> {
    return this.request<any[]>(`/admin/tenants/${id}/lifecycle-events`, {
      method: "GET"
    });
  }

  async provisionTenant(payload: any): Promise<any> {
    return this.request<any>("/admin/tenants/provision", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async activateTenant(id: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/activate`, {
      method: "POST"
    });
  }

  async suspendTenant(id: string, reason: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  }

  async resumeTenant(id: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/resume`, {
      method: "POST"
    });
  }

  async cancelTenant(id: string, reason: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  }

  async changeTenantPlan(id: string, planId: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/change-plan`, {
      method: "POST",
      body: JSON.stringify({ plan_id: planId })
    });
  }

  async assignTenantAddon(id: string, addonId: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/assign-addon`, {
      method: "POST",
      body: JSON.stringify({ addon_id: addonId })
    });
  }

  async removeTenantAddon(id: string, addonId: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/remove-addon`, {
      method: "POST",
      body: JSON.stringify({ addon_id: addonId })
    });
  }

  async attachTenantDomain(id: string, domain: string, type: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/domains`, {
      method: "POST",
      body: JSON.stringify({ domain, type })
    });
  }

  async fetchTenantDomains(id: string): Promise<any[]> {
    return this.request<any[]>(`/admin/tenants/${id}/domains`, {
      method: "GET"
    });
  }

  async fetchTenantSubscriptionSummary(id: string): Promise<any> {
    return this.request<any>(`/admin/tenants/${id}/subscription-summary`, {
      method: "GET"
    });
  }

  async fetchMySubscriptionSummary(tenantId?: string | null): Promise<any> {
    return this.request<any>("/tenant/subscription-summary", {
      method: "GET"
    }, tenantId);
  }

  async fetchMyPlansCatalog(): Promise<any[]> {
    return this.request<any[]>("/tenant/commercial/plans", {
      method: "GET"
    });
  }

  async fetchMyAddonsCatalog(): Promise<any[]> {
    return this.request<any[]>("/tenant/commercial/addons", {
      method: "GET"
    });
  }

  async upgradeMyPlan(planId: string): Promise<any> {
    return this.request<any>("/tenant/subscription/upgrade", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId })
    });
  }

  async purchaseMyAddon(addonId: string): Promise<any> {
    return this.request<any>("/tenant/addons", {
      method: "POST",
      body: JSON.stringify({ addon_id: addonId })
    });
  }

  async removeMyAddon(addonId: string): Promise<any> {
    return this.request<any>(`/tenant/addons/${addonId}`, {
      method: "DELETE"
    });
  }

  async fetchAdminTenants(): Promise<any[]> {
    return this.request<any[]>("/admin/tenants", {
      method: "GET"
    });
  }

  async fetchDashboardStats(): Promise<any> {
    return this.request<any>("/admin/dashboard-stats", {
      method: "GET"
    });
  }

  async createAdminTenant(payload?: { name: string; code: string; plan?: string }): Promise<any> {
    return this.request<any>("/admin/tenants", {
      method: "POST",
      body: JSON.stringify(payload || { name: "Sandbox Demo Corp", code: "sandbox-demo", plan: "GROWTH" }),
    });
  }

  async fetchTenantUsers(): Promise<{ message: string; scope: string; timestamp: string }> {
    return this.request<{ message: string; scope: string; timestamp: string }>("/tenant/users", {
      method: "GET"
    });
  }

  // ==========================================
  // SPRINT 2A INVENTORY OPERATIONS
  // ==========================================

  async fetchMeasurementUnits(): Promise<any[]> {
    return this.request<any[]>("/measurement-units", { method: "GET" });
  }

  async fetchProjects(params?: Record<string, any>): Promise<any> {
    let endpoint = "/projects";
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString();
      if (qStr) endpoint += `?${qStr}`;
    }
    return this.request<any>(endpoint, { method: "GET" });
  }

  async fetchProject(id: string): Promise<any> {
    return this.request<any>(`/projects/${id}`, { method: "GET" });
  }

  async createProject(data: any): Promise<any> {
    return this.request<any>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any): Promise<any> {
    return this.request<any>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: "DELETE" });
  }

  async fetchLayouts(params?: Record<string, any>): Promise<any> {
    let endpoint = "/layouts";
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString();
      if (qStr) endpoint += `?${qStr}`;
    }
    return this.request<any>(endpoint, { method: "GET" });
  }

  async fetchLayout(id: string): Promise<any> {
    return this.request<any>(`/layouts/${id}`, { method: "GET" });
  }

  async createLayout(data: any): Promise<any> {
    return this.request<any>("/layouts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLayout(id: string, data: any): Promise<any> {
    return this.request<any>(`/layouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteLayout(id: string): Promise<void> {
    return this.request<void>(`/layouts/${id}`, { method: "DELETE" });
  }

  async fetchPlots(params?: Record<string, any>): Promise<any> {
    let endpoint = "/plots";
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString();
      if (qStr) endpoint += `?${qStr}`;
    }
    return this.request<any>(endpoint, { method: "GET" });
  }

  async fetchPlot(id: string): Promise<any> {
    return this.request<any>(`/plots/${id}`, { method: "GET" });
  }

  async createPlot(data: any): Promise<any> {
    return this.request<any>("/plots", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlot(id: string, data: any): Promise<any> {
    return this.request<any>(`/plots/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePlot(id: string): Promise<void> {
    return this.request<void>(`/plots/${id}`, { method: "DELETE" });
  }

  // ==========================================
  // SPRINT 3A DXF IMPORT CORE OPERATIONS
  // ==========================================

  async fetchDxfFiles(): Promise<any[]> {
    return this.request<any[]>("/dxf/files", { method: "GET" });
  }

  async fetchDxfJobs(): Promise<any[]> {
    return this.request<any[]>("/dxf/jobs", { method: "GET" });
  }

  async fetchDxfJobDetail(id: string): Promise<any> {
    return this.request<any>(`/dxf/jobs/${id}`, { method: "GET" });
  }

  async uploadDxfFile(formData: FormData): Promise<any> {
    return this.request<any>("/dxf/upload", {
      method: "POST",
      body: formData,
    });
  }

  async saveDxfMappings(dxfFileId: string, mappings: any[]): Promise<any> {
    return this.request<any>("/dxf/mappings", {
      method: "POST",
      body: JSON.stringify({
        dxf_file_id: dxfFileId,
        mappings,
      }),
    });
  }

  async approveDxfMappings(dxfFileId: string): Promise<any> {
    return this.request<any>("/dxf/process", {
      method: "POST",
      body: JSON.stringify({
        dxf_file_id: dxfFileId,
      }),
    });
  }

  async fetchDxfTemplates(): Promise<any[]> {
    return this.request<any[]>("/dxf/templates", { method: "GET" });
  }

  async storeDxfTemplate(name: string, mappings: Record<string, string>): Promise<any> {
    return this.request<any>("/dxf/templates", {
      method: "POST",
      body: JSON.stringify({
        name,
        mappings,
      }),
    });
  }

  async deleteDxfTemplate(id: string): Promise<any> {
    return this.request<any>(`/dxf/templates/${id}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // SPRINT 3E & 4A SVG ENDPOINTS
  // ==========================================

  async compileSvgDocument(batchId: string, renderProfile: string = "DESKTOP"): Promise<any> {
    return this.request<any>(`/dxf/generation-batches/${batchId}/compile-svg`, {
      method: "POST",
      body: JSON.stringify({ render_profile: renderProfile }),
    });
  }

  async fetchSvgDocument(id: string): Promise<any> {
    return this.request<any>(`/dxf/svg-documents/${id}`, {
      method: "GET",
    });
  }

  async fetchStyleProfiles(): Promise<any> {
    return this.request<any>("/dxf/style-profiles", {
      method: "GET",
    });
  }

  // ==========================================
  // PHASE 2B MARKETPLACE ENDPOINTS
  // ==========================================

  async fetchPublicProjects(params?: Record<string, any>): Promise<any[]> {
    let endpoint = "/public/marketplace/projects";
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
      const qStr = query.toString();
      if (qStr) endpoint += `?${qStr}`;
    }
    return this.request<any[]>(endpoint, { method: "GET" });
  }

  async fetchPublicProject(id: string): Promise<any> {
    return this.request<any>(`/public/marketplace/projects/${id}`, { method: "GET" });
  }

  async fetchPublicDevelopers(): Promise<any[]> {
    return this.request<any[]>("/public/marketplace/developers", { method: "GET" });
  }

  async fetchPublicDeveloper(slug: string): Promise<any> {
    return this.request<any>(`/public/marketplace/developers/${slug}`, { method: "GET" });
  }

  async submitPublicLead(payload: {
    tenant_id: string;
    project_id?: string;
    layout_id?: string;
    plot_id?: string;
    lead_type: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
    metadata?: any;
  }): Promise<any> {
    return this.request<any>("/public/marketplace/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async fetchDeveloperProfile(): Promise<any> {
    return this.request<any>("/tenant/marketplace/developer-profile", { method: "GET" });
  }

  async updateDeveloperProfile(payload: any): Promise<any> {
    return this.request<any>("/tenant/marketplace/developer-profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async publishProject(id: string, status: string): Promise<any> {
    return this.request<any>(`/tenant/marketplace/projects/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  async updateProjectSeo(id: string, payload: any): Promise<any> {
    return this.request<any>(`/tenant/marketplace/projects/${id}/seo`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateLayoutVisibility(id: string, payload: { visibility: string; price_range?: string }): Promise<any> {
    return this.request<any>(`/tenant/marketplace/layouts/${id}/visibility`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updatePlotVisibility(id: string, payload: { marketplace_visible: boolean; price?: number }): Promise<any> {
    return this.request<any>(`/tenant/marketplace/plots/${id}/visibility`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async fetchTenantLeads(): Promise<any[]> {
    return this.request<any[]>("/tenant/marketplace/leads", { method: "GET" });
  }

  async fetchTenantMarketplaceStats(): Promise<any> {
    return this.request<any>("/tenant/marketplace/dashboard-stats", { method: "GET" });
  }

  async fetchAdminMarketplaceProjects(): Promise<any[]> {
    return this.request<any[]>("/admin/marketplace/projects", { method: "GET" });
  }

  async moderateMarketplaceProject(id: string, payload: { status: string; reason: string }): Promise<any> {
    return this.request<any>(`/admin/marketplace/projects/${id}/moderate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async fetchAdminMarketplaceDevelopers(): Promise<any[]> {
    return this.request<any[]>("/admin/marketplace/developers", { method: "GET" });
  }

  async moderateMarketplaceDeveloper(id: string, payload: { status: string }): Promise<any> {
    return this.request<any>(`/admin/marketplace/developers/${id}/moderate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // TENANT LIFECYCLE ACTIONS ENTERPRISE API MODULE
  async fetchLifecycleHealth(): Promise<any> {
    return this.request<any>("/admin/lifecycle/health", { method: "GET" });
  }

  async fetchQueueStatus(): Promise<any> {
    return this.request<any>("/admin/lifecycle/queue", { method: "GET" });
  }

  async resetDemoTenant(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/reset`, { method: "POST" });
  }

  async reprovisionTenant(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/reprovision`, { method: "POST" });
  }

  async verifyTenantProvisioning(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/verify`, { method: "POST" });
  }

  async resetTenantDomain(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/reset-domain`, { method: "POST" });
  }

  async generateDemoData(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/generate-demo`, { method: "POST" });
  }

  async archiveTenant(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/archive`, { method: "POST" });
  }

  async deleteDemoTenant(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/delete`, { method: "POST" });
  }

  async verifyTenantDns(tenantCode: string): Promise<any> {
    return this.request<any>(`/admin/lifecycle/${tenantCode}/dns-verify`, { method: "POST" });
  }
}

export const api = new ApiClient();
export default api;
