
export enum RiskDomain {
  HumanFactor = 'Human-Factor Risk (M1)',
  CognitiveBias = 'Cognitive-Bias Risk (M2)',
  Algorithmic = 'Algorithmic & AI Risk (M3)',
}

// M3: Governance & Audit
export interface AuditLogEntry {
  id?: string; // Firestore ID
  partnerId: string;
  timestamp: string; // ISO String
  module: 'M1' | 'M2' | 'M3';
  action: string;
  details: string;
  complianceTags: string[]; // e.g., "DORA Art 24", "EU AI Act Art 14"
  hash: string; // SHA-256 of this record
  previousHash: string; // SHA-256 of the immediate parent record
}

// M1: Sensing Data
export interface ACOREAssessment {
  partnerId: string;
  timestamp: string;
  adkar: {
    awareness: number; // 0-100
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
  orsScore: number; // Organizational Resilience Score
  riskFlags: {
    highChangeFatigue: boolean;
    lowPsychSafety: boolean;
    highJobStrain: boolean;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// M2: Decision Engine
export interface PremortemRequest {
  partnerId: string;
  context: string; // The strategic decision to analyze
  acoreRiskProfile?: ACOREResult; // Optional M1 context
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
  auditHash: string; // Reference to the M3 log created
}
