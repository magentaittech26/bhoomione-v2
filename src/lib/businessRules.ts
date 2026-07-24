import { BusinessRuleEvaluationResponse, PrecheckEvaluationRequest } from '../types/businessRules';

export async function precheckBusinessRules(
  request: PrecheckEvaluationRequest,
  tenantId?: string
): Promise<BusinessRuleEvaluationResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  try {
    const res = await fetch('/api/v1/tenant/business-rules/evaluate', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const data: BusinessRuleEvaluationResponse = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to communicate with Business Rules Engine.',
      error: {
        code: 'NETWORK_ERROR',
        evaluation_id: 'LOCAL-ERROR',
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id || null,
        blocking_rules: [
          {
            rule_code: 'system.network_error',
            rule_version: '1.0.0',
            message: 'Network error occurred while connecting to rules precheck endpoint.',
            error_code: 'NETWORK_DISCONNECTED',
            remediation: 'Check server connection and retry.',
          },
        ],
        warnings: [],
      },
      correlation_id: 'err-client',
    };
  }
}

export function formatRuleFailuresForUi(response: BusinessRuleEvaluationResponse): {
  isBlocked: boolean;
  blockingMessages: string[];
  remediations: string[];
} {
  if (response.success || !response.error) {
    return { isBlocked: false, blockingMessages: [], remediations: [] };
  }

  const blockingMessages = response.error.blocking_rules.map((r) => r.message);
  const remediations = response.error.blocking_rules
    .map((r) => r.remediation)
    .filter((rem): rem is string => Boolean(rem));

  return {
    isBlocked: true,
    blockingMessages,
    remediations,
  };
}
