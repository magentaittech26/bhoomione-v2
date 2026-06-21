export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  kycStatus: string;
  role: string | null;
  tenantId: string | null;
  tenantCode?: string | null;
  companyName?: string | null;
  permissions?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  database: "CONNECTED" | "DISCONNECTED";
  databaseError: string | null;
  environmentStatus: string;
}
