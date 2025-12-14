// =============================================================================
// KDSA M2 Type Definitions - Charter Compliant v2.0
// G-001, G-002, G-003 Remediation Complete
// Source: M1 Charter v3.0 Section 14.2, M2 Charter v3.0 Section 14.3
// =============================================================================

export enum RiskDomain {
  HumanFactor = 'Human-Factor Risk (M1)',
  CognitiveBias = 'Cognitive-Bias Risk (M2)',
  Algorithmic = 'Algorithmic & AI Risk (M3)',
}

// === ENUMERATIONS (M2 Charter v3.1 Section 13) ===

/**
 * De-biasing protocols per M2 Charter v3.1 Section 13.1
 */
export enum DebiasProtocol {
  StandardAnalysis = 'STANDARD_ANALYSIS',
  ConsiderTheOpposite = 'CONSIDER_THE_OPPOSITE',
  PreMortemAdvisory = 'PRE_MORTEM_ADVISORY',
  PreMortemMandatory = 'PRE_MORTEM_MANDATORY'
}

/**
 * Cognitive bias types detected by M2 (M2 Charter v3.0 Section 13.2)
 */
export enum BiasType {
  Anchoring = 'Anchoring',
  Overconfidence = 'Overconfidence',
  StatusQuo = 'StatusQuo',
  Confirmation = 'Confirmation',
  Availability = 'Availability',
  Groupthink = 'Groupthink',
  SunkCost = 'SunkCost',
  Framing = 'Framing'
}

/**
 * Bias severity levels
 */
export enum BiasSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

/**
 * ATRI Zone classifications (M1 Charter v3.0 Section 13.3)
 */
export enum AtriZone {
  Ambidextrous = 'AMBIDEXTROUS',  // 85-100: Aggressive Expansion
  Resilient = 'RESILIENT',        // 70-84: Optimization
  Strained = 'STRAINED',          // 55-69: Stabilization
  Critical = 'CRITICAL'           // < 55: Triage
}

/**
 * Determinism tiers for output classification (G-003 Remediation)
 */
export enum DeterminismTier {
  TIER_1_DETERMINISTIC = 'TIER_1_DETERMINISTIC',   // 100% reproducible
  TIER_2_CONSTRAINED = 'TIER_2_CONSTRAINED',       // 95%+ reproducible
  TIER_3_STOCHASTIC = 'TIER_3_STOCHASTIC'          // < 95% reproducible
}

/**
 * Decision outcome recommendations
 */
export enum DecisionOutcome {
  PROCEED = 'PROCEED',
  PROCEED_WITH_CONTROLS = 'PROCEED_WITH_CONTROLS',
  DELAY_PENDING_REVIEW = 'DELAY_PENDING_REVIEW',
  ABORT_RECOMMENDED = 'ABORT_RECOMMENDED'
}

/**
 * Limiting factors from ATRI calculation (Playbook v3.4 Appendix I.3)
 */
export enum LimitingFactor {
  ENVIRONMENT_CAP = 'ENVIRONMENT_CAP',       // ORS_II < 40
  VALIDATION_VETO = 'VALIDATION_VETO',       // Simulation < 50
  NEURAL_BRAKE = 'NEURAL_BRAKE'              // SCARF_Coefficient < 1.0
}

/**
 * Risk categories for Pre-Mortem scenarios
 */
export enum RiskCategory {
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
  REPUTATIONAL = 'REPUTATIONAL',
  REGULATORY = 'REGULATORY',
  STRATEGIC = 'STRATEGIC'
}

/**
 * Risk level classification
 */
export enum RiskLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Critical = 'CRITICAL'
}

/**
 * Trigger condition codes (M1 Charter v3.0 Section 14.3)
 */
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

// === M1 INPUT TYPES (Source: M1 Charter v3.0 Section 14.2) ===

/**
 * Component scores for ATRI calculation
 */
export interface ComponentScores {
  ors_ii: number;          // Organizational Resilience Score II (0-100)
  racq: number;            // Resilience & Adaptive Capacity Quotient (0-5)
  simulation: number;      // Simulation/Validation score (0-100)
  scarf_coefficient: number; // SCARF multiplier (0-1)
}

/**
 * SCARF Profile (Status, Certainty, Autonomy, Relatedness, Fairness)
 */
export interface ScarfProfile {
  status: number;      // 0-1
  certainty: number;   // 0-1
  autonomy: number;    // 0-1
  relatedness: number; // 0-1
  fairness: number;    // 0-1
}

/**
 * Complete M1 Risk Flag structure per M1 Charter v3.0 Section 14.2
 * G-001 REMEDIATION: All charter-mandated fields included
 */
export interface M1RiskFlag {
  risk_flag: boolean;
  primary_driver: string;
  atri_score: number;
  atri_zone: AtriZone | string;
  component_scores: ComponentScores;
  scarf_profile: ScarfProfile;
  trigger_conditions: TriggerCondition[];
  timestamp: string;
}

// === M2 OUTPUT TYPES (Source: M2 Charter v3.0 Section 14.3) ===

/**
 * Summarized M1 input for M2's output log per M2 Charter v3.0 Section 14.3
 */
export interface M1InputFlagSummary {
  risk_flag: boolean;
  primary_driver: string;
  atri_score: number;
  atri_zone: string;
  limiting_factors_active: string[];
  scarf_threat_domains: string[];
}

/**
 * M2 Recommendation structure per M2 Charter v3.0 Section 14.3
 */
export interface M2Recommendation {
  decision_outcome: DecisionOutcome | string;
  determinism_level: DeterminismTier | string;
  logic_trace_id: string;
  causal_path: string[];
  confidence_score: number;
}

/**
 * Cognitive bias log entry
 */
export interface CognitiveBiasLog {
  type: BiasType | string;
  severity: BiasSeverity | string;
  description: string;
  mitigation: string;
  evidence: string;
}

/**
 * Pre-Mortem scenario log entry
 */
export interface PreMortemScenarioLog {
  title: string;
  probability: number;
  description: string;
  mitigation_strategy: string;
  risk_category: RiskCategory | string;
}

/**
 * Complete output_decision_log structure per M2 Charter v3.0 Section 14.3
 * G-002 REMEDIATION: All charter-mandated fields included
 */
export interface OutputDecisionLog {
  decision_id: string;
  timestamp: string;

  // M1 INPUT FLAG (Nested Object per Charter)
  m1_input_flag: M1InputFlagSummary;

  // DEBIASING WORKFLOW FIELDS
  debiasing_workflow_triggered: string;
  consider_opposite_completed: boolean;

  // BIAS DETECTION
  biases_detected: string[];
  biases_detail: CognitiveBiasLog[];

  // M2 RECOMMENDATION (Nested Object per Charter)
  m2_recommendation: M2Recommendation;

  // USER OVERRIDE TRACKING
  user_override: boolean;
  user_override_justification?: string;

  // PRE-MORTEM SCENARIOS
  pre_mortem_scenarios: PreMortemScenarioLog[];

  // EXECUTIVE SUMMARY
  executive_summary: string;

  // DETERMINISM VERIFICATION (G-003 Remediation)
  input_hash: string;
  output_hash: string;
  seed: number;
  determinism_verified: boolean;
  determinism_tier: DeterminismTier | string;

  // COMPLIANCE TAGS
  compliance_tags: string[];
}

// === LEGACY TYPES (Backward Compatibility) ===

// M3: Governance & Audit
export interface AuditLogEntry {
  id?: string;
  partnerId: string;
  timestamp: string;
  module: 'M1' | 'M2' | 'M3';
  action: string;
  details: string;
  complianceTags: string[];
  hash: string;
  previousHash: string;
}

// M1: Sensing Data (Legacy ACORE format)
export interface ACOREAssessment {
  partnerId: string;
  timestamp: string;
  adkar: {
    awareness: number;
    desire: number;
    knowledge: number;
    ability: number;
    reinforcement: number;
  };
  scarf: {
    status: number;
    certainty: number;
    autonomy: number;
    relatedness: number;
    fairness: number;
  };
  karasek: {
    jobDemands: number;
    jobControl: number;
  };
}

export interface ACOREResult {
  assessmentId: string;
  orsScore: number;
  riskFlags: {
    highChangeFatigue: boolean;
    lowPsychSafety: boolean;
    highJobStrain: boolean;
  };
  riskLevel: RiskLevel | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Legacy M2 types (maintained for backward compatibility)
export interface PremortemRequest {
  partnerId: string;
  context: string;
  acoreRiskProfile?: ACOREResult;
  m1RiskFlag?: M1RiskFlag;
  knownRisks?: string[];
  initialConclusion?: string;
  supportingEvidence?: string[];
}

export interface PremortemResponse {
  decisionId: string;
  detectedBiases: string[];
  scenarios: {
    scenario: string;
    probability: string;
    impact: string;
    mitigation: string;
  }[];
  auditHash: string;
}

// === REQUEST/RESPONSE TYPES FOR NEW API ===

/**
 * Decision Engine analysis request
 */
export interface DecisionEngineRequest {
  decisionId?: string;
  partnerId: string;
  decisionContext: string;
  knownRisks?: string[];
  m1RiskFlag?: M1RiskFlag;
  initialConclusion?: string;
  supportingEvidence?: string[];
}

/**
 * Pre-Mortem analysis request
 */
export interface PreMortemRequest {
  decisionContext: string;
  knownRisks?: string[];
  atriScore: number;
  atriZone: string;
  scarfThreatDomains?: string[];
  limitingFactors?: string[];
  detectedBiases?: string[];
}

/**
 * Pre-Mortem analysis result
 */
export interface PreMortemResult {
  decisionId: string;
  scenarios: PreMortemScenarioLog[];
  seed: number;
  inputHash: string;
  outputHash: string;
}

/**
 * Contrarian (Consider-the-Opposite) request
 */
export interface ContrarianRequest {
  initialConclusion: string;
  supportingEvidence?: string[];
  detectedBiases?: string[];
}

/**
 * Contrarian analysis result
 */
export interface ContrarianResult {
  counterArguments: string[];
  alternativeHypothesis: string;
  disconfirmingEvidence: string;
  recommendedAction: 'PROCEED' | 'MODIFY' | 'RECONSIDER';
  seed: number;
  inputHash: string;
  outputHash: string;
}

/**
 * Determinism verification report (G-003)
 */
export interface DeterminismReport {
  verificationId: string;
  iterations: number;
  seed: number;
  uniqueHashCount: number;
  consistencyRate: number;
  determinismTier: DeterminismTier;
  isFullyDeterministic: boolean;
  iterationHashes: { iteration: number; hash: string }[];
}

/**
 * De-biasing decision result from rule engine
 */
export interface DebiasDecision {
  decisionId: string;
  timestamp: string;
  inputHash: string;
  requiredProtocols: DebiasProtocol[];
  riskLevel: RiskLevel;
  primaryDriver: string;
  limitingFactorsActive: LimitingFactor[];
  scarfThreatDomains: string[];
}

/**
 * Detected cognitive bias
 */
export interface CognitiveBias {
  type: BiasType;
  severity: BiasSeverity;
  description: string;
  mitigation: string;
  evidence: string;
}

// === UTILITY FUNCTIONS ===

/**
 * Calculate ATRI score per Playbook v3.4 Appendix I
 * ATRI = ((ORS_II × 0.30) + (RACQ_normalized × 0.30) + (Simulation × 0.40)) × SCARF_Coefficient
 */
export const calculateATRI = (components: ComponentScores): number => {
  const racqNormalized = (components.racq / 5.0) * 100;
  const rawScore = (components.ors_ii * 0.30) + (racqNormalized * 0.30) + (components.simulation * 0.40);
  return rawScore * components.scarf_coefficient;
};

/**
 * Determine ATRI Zone from score (M1 Charter v3.0 Section 13.3)
 */
export const determineAtriZone = (score: number): AtriZone => {
  if (score >= 85) return AtriZone.Ambidextrous;
  if (score >= 70) return AtriZone.Resilient;
  if (score >= 55) return AtriZone.Strained;
  return AtriZone.Critical;
};

/**
 * Identify limiting factors (Playbook v3.4 Appendix I.3)
 */
export const identifyLimitingFactors = (components: ComponentScores): LimitingFactor[] => {
  const factors: LimitingFactor[] = [];
  if (components.ors_ii < 40) factors.push(LimitingFactor.ENVIRONMENT_CAP);
  if (components.simulation < 50) factors.push(LimitingFactor.VALIDATION_VETO);
  if (components.scarf_coefficient < 1.0) factors.push(LimitingFactor.NEURAL_BRAKE);
  return factors;
};

/**
 * Identify SCARF threat domains (domains < 0.5)
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
 * Get minimum SCARF domain value
 */
export const getMinimumScarfDomain = (profile: ScarfProfile): number => {
  return Math.min(profile.status, profile.certainty, profile.autonomy, profile.relatedness, profile.fairness);
};

/**
 * Get primary SCARF threat domain (lowest value)
 */
export const getPrimaryScarfThreat = (profile: ScarfProfile): string => {
  const domains: Record<string, number> = {
    STATUS: profile.status,
    CERTAINTY: profile.certainty,
    AUTONOMY: profile.autonomy,
    RELATEDNESS: profile.relatedness,
    FAIRNESS: profile.fairness
  };

  let minDomain = 'STATUS';
  let minValue = profile.status;

  for (const [domain, value] of Object.entries(domains)) {
    if (value < minValue) {
      minValue = value;
      minDomain = domain;
    }
  }

  return minDomain;
};

/**
 * Default compliance tags for M2 Decision Engine
 */
export const DEFAULT_COMPLIANCE_TAGS = [
  'EU AI Act Art 10',
  'EU AI Act Art 13',
  'EU AI Act Art 14',
  'DORA Pillar 3',
  'NIST AI RMF Map 1.2'
];
