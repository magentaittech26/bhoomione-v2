import { AuthResponse, UserProfile, SystemHealth } from "../types/auth.ts";

class ApiClient {
  private baseUri = ((import.meta as any).env?.VITE_LARAVEL_API_URL || "/api/v1").replace(/\/$/, "");

  // Get tokens from sessionStorage or localStorage to survive page refreshes and iframe reloads
  getAccessToken(): string | null {
    return sessionStorage.getItem("bhoomi_access_token") || localStorage.getItem("bhoomi_access_token");
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem("bhoomi_refresh_token") || localStorage.getItem("bhoomi_refresh_token");
  }

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem("bhoomi_access_token", accessToken);
    sessionStorage.setItem("bhoomi_refresh_token", refreshToken);
    localStorage.setItem("bhoomi_access_token", accessToken);
    localStorage.setItem("bhoomi_refresh_token", refreshToken);
  }

  clearTokens(): void {
    sessionStorage.removeItem("bhoomi_access_token");
    sessionStorage.removeItem("bhoomi_refresh_token");
    sessionStorage.removeItem("bhoomi_user_profile");
    localStorage.removeItem("bhoomi_access_token");
    localStorage.removeItem("bhoomi_refresh_token");
    localStorage.removeItem("bhoomi_user_profile");
    // Also clear portal specific persistent logins
    localStorage.removeItem("bhoomi_customer_auth");
    localStorage.removeItem("bhoomi_agent_auth");
  }

  getCurrentUser(): UserProfile | null {
    const raw = sessionStorage.getItem("bhoomi_user_profile") || localStorage.getItem("bhoomi_user_profile");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  setCurrentUser(user: UserProfile): void {
    sessionStorage.setItem("bhoomi_user_profile", JSON.stringify(user));
    localStorage.setItem("bhoomi_user_profile", JSON.stringify(user));
  }

  private async request<T>(
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
    if (tenantId) {
      headers.set("x-tenant-id", tenantId);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    // If unauthorized, attempt transparent refresh token handshake
    if (response.status === 401) {
      const refresh = this.getRefreshToken();
      let refreshSuccess = false;
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
            if (response.status !== 401) {
              refreshSuccess = true;
            }
          }
        } catch (err) {
          console.error("Token refresh routing failed:", err);
        }
      }

      if (!refreshSuccess) {
        console.warn("⚠️ Authentication session expired or invalid. Revoking client authorization.");
        this.clearTokens();
        window.dispatchEvent(new CustomEvent("bhoomi_unauthorized"));
        throw new Error("Your session has expired. Please sign in again to continue.");
      }
    }

    if (!response.ok) {
      let errorMsg = `Server returned an error status: ${response.status}`;
      try {
        const text = await response.text();
        // Check if response is JSON
        if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorMsg;
        } else if (text && text.includes("502 Bad Gateway")) {
          errorMsg = "The server gateway is currently undergoing maintenance. Please retry in a few moments.";
        } else if (text && (text.includes("<!DOCTYPE html>") || text.includes("<html"))) {
          errorMsg = "We encountered a temporary server connection issue. Please try again.";
        }
      } catch (err) {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
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

  async fetchAdminAuditLogs(): Promise<{ message: string; scope: string; timestamp: string }> {
    return this.request<{ message: string; scope: string; timestamp: string }>("/admin/audit-logs", {
      method: "GET"
    });
  }

  async createAdminTenant(): Promise<{ message: string; scope: string; timestamp: string }> {
    return this.request<{ message: string; scope: string; timestamp: string }>("/admin/tenants", {
      method: "POST"
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
    const url = `${this.baseUri}/projects/${id}`;
    const token = this.getAccessToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete project.");
    }
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
    const url = `${this.baseUri}/layouts/${id}`;
    const token = this.getAccessToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete layout.");
    }
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
    const url = `${this.baseUri}/plots/${id}`;
    const token = this.getAccessToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete plot.");
    }
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
}

export const api = new ApiClient();
export default api;
