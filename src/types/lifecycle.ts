export type StateColorToken = 'neutral' | 'informational' | 'warning' | 'positive' | 'negative' | 'inactive';

export interface LifecycleState {
  code: string;
  name: string;
  description: string;
  sequence: number;
  initial: boolean;
  terminal: boolean;
  active: boolean;
  visible: boolean;
  operational: boolean;
  immutable: boolean;
  color_token: StateColorToken;
  allowed_actions: string[];
  metadata?: Record<string, any>;
}

export interface LifecycleTransition {
  code: string;
  name: string;
  description: string;
  from_states: string[];
  destination_state: string;
  required_permission?: string | null;
  required_business_rules: string[];
  required_entitlement?: string | null;
  requires_reason: boolean;
  requires_approval: boolean;
  reversible: boolean;
  reversal_transition_code?: string | null;
  automatic: boolean;
  system_only: boolean;
  destructive: boolean;
  financial: boolean;
  compliance_sensitive: boolean;
  allowed_execution_sources: string[];
  events: string[];
  metadata?: Record<string, any>;
}

export interface LifecycleDefinition {
  code: string;
  name: string;
  version: string;
  initial_state: string;
  terminal_states: string[];
  states: LifecycleState[];
  transitions: LifecycleTransition[];
}

export interface TransitionFailure {
  code: string;
  rule_code?: string;
  message: string;
  user_message?: string;
  remediation?: string;
  required_entitlement?: string;
}

export interface TransitionWarning {
  code: string;
  message: string;
}

export interface AvailableTransition {
  transition_code: string;
  name: string;
  description: string;
  destination_state: string;
  permitted: boolean;
  failures: TransitionFailure[];
  warnings: TransitionWarning[];
  required_entitlement?: string | null;
  required_permission?: string | null;
}

export interface LifecycleTransitionHistory {
  id: string;
  tenant_id: string;
  lifecycle_code: string;
  lifecycle_version: string;
  entity_type: string;
  entity_id: string;
  transition_code: string;
  previous_state: string;
  destination_state: string;
  actor_id?: string;
  execution_source: string;
  reason?: string;
  correlation_id: string;
  transitioned_at: string;
}

export interface LifecycleStateSummary {
  lifecycle_code: string;
  lifecycle_version: string;
  entity_type: string;
  entity_id: string;
  current_state: string;
  available_transitions: AvailableTransition[];
  recent_history: LifecycleTransitionHistory[];
}

export interface LifecycleTransitionApiResponse {
  success: boolean;
  message: string;
  data?: {
    transition_id: string;
    lifecycle_code: string;
    lifecycle_version: string;
    entity_type: string;
    entity_id: string;
    transition_code: string;
    previous_state: string;
    destination_state: string;
    completed: boolean;
    warnings: TransitionWarning[];
    available_alternatives: string[];
    execution_time_ms: number;
    transitioned_at: string;
  };
  error?: {
    code: string;
    failures: TransitionFailure[];
    warnings: TransitionWarning[];
  };
  correlation_id: string;
}
