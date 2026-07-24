export type RuleSeverity = 'BLOCKING' | 'WARNING' | 'INFORMATIONAL';
export type EvaluationMode = 'ENFORCE' | 'EXPLAIN' | 'DRY_RUN';

export interface BlockingRuleResult {
  rule_code: string;
  rule_version: string;
  message: string;
  error_code: string | null;
  remediation?: string | null;
  evidence?: Record<string, any>;
  failed_conditions?: Record<string, any>;
}

export interface RuleWarningResult {
  rule_code: string;
  rule_version: string;
  message: string;
  error_code: string | null;
  remediation?: string | null;
}

export interface BusinessRuleEvaluationErrorPayload {
  code: string;
  evaluation_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  blocking_rules: BlockingRuleResult[];
  warnings: RuleWarningResult[];
}

export interface BusinessRuleEvaluationResponse {
  success: boolean;
  message: string;
  error?: BusinessRuleEvaluationErrorPayload;
  data?: {
    evaluation_id: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    passed: boolean;
    evaluated_rule_count: number;
    warnings: RuleWarningResult[];
    execution_time_ms: number;
  };
  correlation_id: string;
}

export interface PrecheckEvaluationRequest {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  project_id?: string | null;
  request_data?: Record<string, any>;
  entity_snapshot?: Record<string, any>;
  related_entity_snapshots?: Record<string, any>;
}
