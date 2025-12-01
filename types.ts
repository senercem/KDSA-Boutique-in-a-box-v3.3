import React from 'react';

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

export interface ACOREDataPoint {
  category: string;
  value: number; // 0-100
  threshold: number;
  description: string;
}

export interface DecisionContext {
  id: string;
  title: string;
  description: string;
  stakeholders: string[];
  acoreRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: 'M1: ACORE' | 'M2: Decision Engine' | 'M3: Alexandra';
  action: string;
  hash: string; // Simulated immutable hash
  complianceTags: string[]; // e.g., "EU AI Act Art 13", "DORA Pillar 3"
  details: string;
}

export interface PremortemScenario {
  scenario: string;
  probability: string;
  impact: string;
  mitigation: string;
}

export interface GovernancePolicy {
  id: string;
  title: string;
  framework: string; // e.g. "EU AI Act", "DORA", "NIST"
  content: string;
  lastUpdated: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<any>;
}