// =============================================================================
// KDSA Frontend Type Definitions - Charter Compliant v2.0
// G-001, G-002, G-003 Remediation Complete
// =============================================================================

import React from 'react';

// === ENUMERATIONS ===

export enum RiskDomain {
  HumanFactor = 'Human-Factor Risk (M1)',
  CognitiveBias = 'Cognitive-Bias Risk (M2)',
  Algorithmic = 'Algorithmic & AI Risk (M3)',
}

export enum ModuleState {
  Idle = 'IDLE',
  Active = 'ACTIVE',
  Complete = 'COMPLETE',
  RiskDetected = 'RISK_DETECTED',
}

export type BiasType =
  | 'Anchoring'
  | 'Overconfidence'
  | 'StatusQuo'
  | 'Confirmation'
  | 'Availability'
  | 'Groupthink'
  | 'SunkCost'
  | 'Framing';

export type BiasSeverity = 'Low' | 'Medium' | 'High';

export type DeterminismTier =
  | 'TIER_1_DETERMINISTIC'
  | 'TIER_2_CONSTRAINED'
  | 'TIER_3_STOCHASTIC';

export type DecisionOutcome =
  | 'PROCEED'
  | 'PROCEED_WITH_CONTROLS'
  | 'DELAY_PENDING_REVIEW'
  | 'ABORT_RECOMMENDED';

export type LimitingFactor =
  | 'ENVIRONMENT_CAP'
  | 'VALIDATION_VETO'
  | 'NEURAL_BRAKE';

export type RiskCategory =
  | 'OPERATIONAL'
  | 'FINANCIAL'
  | 'REPUTATIONAL'
  | 'REGULATORY'
  | 'STRATEGIC';

export type AtriZone = 'AMBIDEXTROUS' | 'RESILIENT' | 'STRAINED' | 'CRITICAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TriggerCondition =
  | 'ATRI_CRITICAL_ZONE'
  | 'ORS_ENVIRONMENT_CONSTRAINT'
  | 'RACQ_CONSTRAINED_CAPACITY'
  | 'SCARF_STATUS_THREAT'
  | 'SCARF_CERTAINTY_THREAT'
  | 'SCARF_AUTONOMY_THREAT'
  | 'SCARF_RELATEDNESS_THREAT'
  | 'SCARF_FAIRNESS_THREAT'
  | 'SIMULATION_SAY_DO_GAP';

// === M1 TYPES (ACORE) ===

export interface ACOREDataPoint {
  category: string;
  value: number; // 0-100
  threshold: number;
  description: string;
}

export interface ComponentScores {
  ors_ii: number;          // 0-100
  racq: number;            // 0-5
  simulation: number;      // 0-100
  scarf_coefficient: number; // 0-1
}

export interface ScarfProfile {
  status: number;      // 0-1
  certainty: number;   // 0-1
  autonomy: number;    // 0-1
  relatedness: number; // 0-1
  fairness: number;    // 0-1
}

/**
 * Complete M1 Risk Flag structure per M1 Charter v3.0 Section 14.2
 * G-001 REMEDIATION
 */
export interface M1RiskFlag {
  risk_flag: boolean;
  primary_driver: string;
  atri_score: number;
  atri_zone: AtriZone;
  component_scores: ComponentScores;
  scarf_profile: ScarfProfile;
  trigger_conditions: TriggerCondition[];
  timestamp: string;
}

// === M2 TYPES (DECISION ENGINE) ===

export interface DecisionContext {
  id: string;
  title: string;
  description: string;
  stakeholders: string[];
  acoreRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
}

export interface PremortemScenario {
  scenario: string;
  probability: string;
  impact: string;
  mitigation: string;
}

/**
 * Pre-Mortem scenario log per M2 Charter v3.0 Section 14.3
 */
export interface PreMortemScenarioLog {
  title: string;
  probability: number;
  description: string;
  mitigation_strategy: string;
  risk_category: RiskCategory;
}

/**
 * Cognitive bias log entry
 */
export interface CognitiveBiasLog {
  type: BiasType;
  severity: BiasSeverity;
  description: string;
  mitigation: string;
  evidence: string;
}

/**
 * M1 Input Summary for M2 output
 */
export interface M1InputFlagSummary {
  risk_flag: boolean;
  primary_driver: string;
  atri_score: number;
  atri_zone: string;
  limiting_factors_active: LimitingFactor[];
  scarf_threat_domains: string[];
}

/**
 * M2 Recommendation structure per M2 Charter v3.0 Section 14.3
 */
export interface M2Recommendation {
  decision_outcome: DecisionOutcome;
  determinism_level: DeterminismTier;
  logic_trace_id: string;
  causal_path: string[];
  confidence_score: number;
}

/**
 * Complete output_decision_log structure per M2 Charter v3.0 Section 14.3
 * G-002 REMEDIATION
 */
export interface OutputDecisionLog {
  decision_id: string;
  timestamp: string;
  m1_input_flag: M1InputFlagSummary;
  debiasing_workflow_triggered: string;
  consider_opposite_completed: boolean;
  biases_detected: string[];
  biases_detail: CognitiveBiasLog[];
  m2_recommendation: M2Recommendation;
  user_override: boolean;
  user_override_justification?: string;
  pre_mortem_scenarios: PreMortemScenarioLog[];
  executive_summary: string;
  input_hash: string;
  output_hash: string;
  seed: number;
  determinism_verified: boolean;
  determinism_tier: DeterminismTier;
  compliance_tags: string[];
}

/**
 * Decision Engine Request
 */
export interface DecisionEngineRequest {
  decisionId?: string;
  decisionContext: string;
  knownRisks?: string[];
  m1RiskFlag?: M1RiskFlag;
  initialConclusion?: string;
  supportingEvidence?: string[];
}

// === M3 TYPES (ALEXANDRA) ===

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: 'M1: ACORE' | 'M2: Decision Engine' | 'M3: Alexandra';
  action: string;
  hash: string;
  complianceTags: string[];
  details: string;
}

export interface GovernancePolicy {
  id: string;
  title: string;
  framework: string;
  content: string;
  lastUpdated: string;
}

// === UI TYPES ===

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<any>;
}

// === BIAS DETECTION PATTERNS ===

export interface BiasPattern {
  pattern: RegExp;
  severity: BiasSeverity;
  description: string;
  mitigation: string;
}

export const BIAS_PATTERNS: Record<BiasType, BiasPattern> = {
  Anchoring: {
    pattern: /\$[\d,]+(\.\d+)?[kKmMbB]?|\d+%|\d{2,}[kKmMbB]/gi,
    severity: 'Medium',
    description: 'Specific numerical figures detected - potential anchoring bias',
    mitigation: 'Consider the Opposite: What if this number were 50% different?'
  },
  Overconfidence: {
    pattern: /\b(definitely|certainly|guarantee|impossible|always|never|100%|zero chance)\b/gi,
    severity: 'High',
    description: 'Absolute language detected - potential overconfidence bias',
    mitigation: 'Pre-Mortem: Imagine this decision failed spectacularly. What went wrong?'
  },
  StatusQuo: {
    pattern: /\b(current|existing|traditional|always done|usual|standard practice)\b/gi,
    severity: 'Low',
    description: 'Status quo references detected - potential resistance to change',
    mitigation: 'Consider: What would a new competitor do without legacy constraints?'
  },
  Confirmation: {
    pattern: /\b(clearly|obviously|everyone knows|proven fact|undeniable)\b/gi,
    severity: 'Medium',
    description: 'Assumed certainty detected - potential confirmation bias',
    mitigation: 'Seek Disconfirming Evidence: What data would change your mind?'
  },
  Availability: {
    pattern: /\b(just happened|recently|last (week|month|quarter)|heard about)\b/gi,
    severity: 'Low',
    description: 'Recent/anecdotal references detected - potential availability bias',
    mitigation: 'Base Rate Check: What does the historical data show?'
  },
  Groupthink: {
    pattern: /\b(everyone agrees|unanimous|no objections|whole team thinks)\b/gi,
    severity: 'High',
    description: 'Unanimous consensus language detected - potential groupthink',
    mitigation: "Devil's Advocate: Assign someone to argue the opposing position"
  },
  SunkCost: {
    pattern: /\b(already invested|spent so much|too far to|can't stop now)\b/gi,
    severity: 'Medium',
    description: 'Past investment justification detected - potential sunk cost fallacy',
    mitigation: 'Zero-Base Thinking: If starting fresh today, would you make this decision?'
  },
  Framing: {
    pattern: /\b(opportunity|threat|gain|loss|risk|reward)\b/gi,
    severity: 'Low',
    description: 'Framing language detected - consider alternative framings',
    mitigation: 'Reframe: How would this look as an opportunity vs. a threat?'
  }
};

// === UTILITY FUNCTIONS ===

/**
 * Calculate ATRI score per Playbook v3.4 Appendix I
 */
export const calculateATRI = (components: ComponentScores): number => {
  const racqNormalized = (components.racq / 5.0) * 100;
  const rawScore = (components.ors_ii * 0.30) + (racqNormalized * 0.30) + (components.simulation * 0.40);
  return rawScore * components.scarf_coefficient;
};

/**
 * Determine ATRI Zone from score
 */
export const determineAtriZone = (score: number): AtriZone => {
  if (score >= 85) return 'AMBIDEXTROUS';
  if (score >= 70) return 'RESILIENT';
  if (score >= 55) return 'STRAINED';
  return 'CRITICAL';
};

/**
 * Identify limiting factors
 */
export const identifyLimitingFactors = (components: ComponentScores): LimitingFactor[] => {
  const factors: LimitingFactor[] = [];
  if (components.ors_ii < 40) factors.push('ENVIRONMENT_CAP');
  if (components.simulation < 50) factors.push('VALIDATION_VETO');
  if (components.scarf_coefficient < 1.0) factors.push('NEURAL_BRAKE');
  return factors;
};

/**
 * Identify SCARF threat domains
 */
export const identifyScarfThreats = (profile: ScarfProfile): string[] => {
  const threats: string[] = [];
  if (profile.status < 0.5) threats.push('STATUS');
  if (profile.certainty < 0.5) threats.push('CERTAINTY');
  if (profile.autonomy < 0.5) threats.push('AUTONOMY');
  if (profile.relatedness < 0.5) threats.push('RELATEDNESS');
  if (profile.fairness < 0.5) threats.push('FAIRNESS');
  return threats;
};

/**
 * Detect biases in text (client-side)
 */
export const detectBiasesClientSide = (text: string): CognitiveBiasLog[] => {
  if (!text) return [];

  const detected: CognitiveBiasLog[] = [];

  for (const [biasType, config] of Object.entries(BIAS_PATTERNS)) {
    const matches = text.match(config.pattern);
    if (matches && matches.length > 0) {
      detected.push({
        type: biasType as BiasType,
        severity: config.severity,
        description: config.description,
        mitigation: config.mitigation,
        evidence: matches.slice(0, 3).join(', ')
      });
    }
  }

  return detected;
};

/**
 * Determine risk level
 */
export const determineRiskLevel = (
  atriScore: number,
  threatCount: number,
  factorCount: number
): RiskLevel => {
  if (atriScore < 55) return 'CRITICAL';
  if (atriScore < 60 && threatCount > 0) return 'CRITICAL';
  if (threatCount >= 3 || factorCount >= 2) return 'HIGH';
  if (atriScore < 70) return 'HIGH';
  if (atriScore < 85) return 'MEDIUM';
  return 'LOW';
};

/**
 * Determine de-biasing protocol
 */
export const determineProtocol = (riskFlag: boolean, level: RiskLevel): string => {
  if (riskFlag) return 'PRE_MORTEM_MANDATORY';
  switch (level) {
    case 'CRITICAL': return 'PRE_MORTEM_MANDATORY';
    case 'HIGH': return 'PRE_MORTEM_ADVISORY, CONSIDER_THE_OPPOSITE';
    case 'MEDIUM': return 'CONSIDER_THE_OPPOSITE';
    default: return 'STANDARD_ANALYSIS';
  }
};

/**
 * Default compliance tags
 */
export const DEFAULT_COMPLIANCE_TAGS = [
  'EU AI Act Art 10',
  'EU AI Act Art 13',
  'EU AI Act Art 14',
  'DORA Pillar 3',
  'NIST AI RMF Map 1.2'
];
