import { ACOREDataPoint, AuditLogEntry, GovernancePolicy } from './types';

export const EMPTY_ACORE_METRICS: ACOREDataPoint[] = [
  { category: 'Psychological Safety', value: 50, threshold: 60, description: 'Team confidence in voicing dissent without fear.' },
  { category: 'Change Fatigue', value: 50, threshold: 50, description: 'Organizational exhaustion from rapid shifts.' },
  { category: 'Role Clarity', value: 50, threshold: 70, description: 'Understanding of responsibilities in the new model.' },
  { category: 'Leadership Trust', value: 50, threshold: 75, description: 'Confidence in executive vision and integrity.' },
  { category: 'Skill Readiness', value: 50, threshold: 60, description: 'Gap between current capabilities and future needs.' },
];

export const COMPLIANCE_MAPPING = {
  M1: ['DORA Pillar 4 (ICT Risk)', 'EU AI Act Art 14 (Human Oversight)'],
  M2: ['EU AI Act Art 13 (Transparency)', 'DALBAR QAIB (Alpha Loss)'],
  M3: ['EU AI Act Art 10 (Data Gov)', 'DORA Pillar 3 (Resilience Testing)'],
};

export const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: 'log-init-001',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    module: 'M3: Alexandra',
    action: 'System Initialization',
    hash: 'sha256-init7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
    complianceTags: ['NIST AI RMF (Govern)'],
    details: 'Immutable Audit Ledger initialized. Waiting for M1/M2 inputs.',
  },
];

export const INITIAL_POLICIES: GovernancePolicy[] = [
  {
    id: 'pol-001',
    title: 'Human Oversight Protocol',
    framework: 'EU AI Act (Art 14)',
    content: 'The organization shall ensure that all high-risk AI systems are subject to human oversight. This oversight shall be effective, meaning that the human overseer must fully understand the system\'s capabilities and limitations and be able to intervene or stop the system at any time.',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'pol-002',
    title: 'ICT Third-Party Risk Strategy',
    framework: 'DORA (Art 28)',
    content: 'A multi-vendor strategy must be employed for critical ICT services to avoid lock-in. All third-party providers must undergo a rigorous security assessment and agree to defined service level agreements (SLAs) regarding availability and data integrity.',
    lastUpdated: new Date().toISOString()
  }
];