import { LifecycleStateSummary, LifecycleTransitionApiResponse } from '../types/lifecycle';

const API_BASE_URL = '/api/v1';

function getAuthHeaders(tenantId?: string): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const activeTenant = tenantId || localStorage.getItem('tenant_id') || 'dev-01';

  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Tenant-ID': activeTenant,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export async function fetchLifecycleState(
  entityType: string,
  entityId: string,
  tenantId?: string
): Promise<LifecycleStateSummary> {
  const response = await fetch(`${API_BASE_URL}/tenant/lifecycle/${entityType}/${entityId}`, {
    method: 'GET',
    headers: getAuthHeaders(tenantId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lifecycle state: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
}

export async function evaluateTransition(
  entityType: string,
  entityId: string,
  transitionCode: string,
  currentStatus: string,
  reason?: string,
  tenantId?: string
): Promise<LifecycleTransitionApiResponse> {
  const response = await fetch(`${API_BASE_URL}/tenant/lifecycle/${entityType}/${entityId}/evaluate`, {
    method: 'POST',
    headers: getAuthHeaders(tenantId),
    body: JSON.stringify({
      transition_code: transitionCode,
      current_status: currentStatus,
      reason,
    }),
  });

  return await response.json();
}

export async function performTransition(
  entityType: string,
  entityId: string,
  transitionCode: string,
  currentStatus: string,
  reason?: string,
  idempotencyKey?: string,
  tenantId?: string
): Promise<LifecycleTransitionApiResponse> {
  const headers: Record<string, string> = {
    ...(getAuthHeaders(tenantId) as Record<string, string>),
  };

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${API_BASE_URL}/tenant/lifecycle/${entityType}/${entityId}/transition`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transition_code: transitionCode,
      current_status: currentStatus,
      reason,
      idempotency_key: idempotencyKey,
    }),
  });

  return await response.json();
}

export async function fetchTransitionHistory(
  entityType: string,
  entityId: string,
  tenantId?: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/tenant/lifecycle/${entityType}/${entityId}/history`, {
    method: 'GET',
    headers: getAuthHeaders(tenantId),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }

  return await response.json();
}
