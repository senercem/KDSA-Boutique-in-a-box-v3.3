// =============================================================================
// KDSA API Routes - Charter Compliant v2.0
// Implements CaaS API contract per Playbook v3.4 Appendix G.3
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { kdsaM1Service } from '../services/kdsaM1Service';
import { kdsaM2Service } from '../services/kdsaM2Service';
import { kdsaAuditService } from '../services/kdsaAuditService';
import {
  ACOREAssessment,
  PremortemRequest,
  DecisionEngineRequest,
  M1RiskFlag,
  OutputDecisionLog
} from '../types/kdsa.types';

const router = Router();

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Partner Authentication Middleware
 * In production, validate against Firestore 'companies' collection
 */
const partnerAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-api-key header'
    });
  }
  // Mock partner injection - in production, lookup by API key
  req.body.partnerId = req.body.partnerId || 'partner-123';
  next();
};

// Apply Auth to all routes
router.use(partnerAuth);

// =============================================================================
// M1: ACORE SENSING ENDPOINTS
// =============================================================================

/**
 * POST /api/kdsa/m1/assess
 * Process ACORE assessment and return risk profile
 */
router.post('/m1/assess', async (req: Request, res: Response) => {
  try {
    const data: ACOREAssessment = req.body;
    const result = await kdsaM1Service.processAssessment(data);
    res.json(result);
  } catch (error) {
    console.error('M1 Assessment Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M1',
      message: 'Failed to process ACORE assessment'
    });
  }
});

/**
 * POST /api/kdsa/m1/risk-flag
 * Generate M1 Risk Flag (Charter v3.0 Section 14.2 compliant)
 */
router.post('/m1/risk-flag', async (req: Request, res: Response) => {
  try {
    const data: ACOREAssessment = req.body;
    const result = await kdsaM1Service.processAssessment(data);

    // Convert to M1RiskFlag format
    const riskFlag: M1RiskFlag = {
      risk_flag: result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL',
      primary_driver: determineM1PrimaryDriver(result),
      atri_score: result.orsScore,
      atri_zone: determineAtriZoneFromScore(result.orsScore),
      component_scores: {
        ors_ii: result.orsScore,
        racq: 3.5, // Default - would come from full assessment
        simulation: 70, // Default
        scarf_coefficient: 0.85 // Default
      },
      scarf_profile: {
        status: (data.scarf?.status || 70) / 100,
        certainty: (data.scarf?.certainty || 70) / 100,
        autonomy: (data.scarf?.autonomy || 70) / 100,
        relatedness: (data.scarf?.relatedness || 70) / 100,
        fairness: (data.scarf?.fairness || 70) / 100
      },
      trigger_conditions: generateTriggerConditions(result, data),
      timestamp: new Date().toISOString()
    };

    res.json(riskFlag);
  } catch (error) {
    console.error('M1 Risk Flag Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M1',
      message: 'Failed to generate risk flag'
    });
  }
});

// =============================================================================
// M2: DECISION ENGINE ENDPOINTS
// =============================================================================

/**
 * POST /api/kdsa/m2/analyze
 * Primary CaaS endpoint per Playbook v3.4 Appendix G.3
 * Implements Golden Thread Steps 3-8
 */
router.post('/m2/analyze', async (req: Request, res: Response) => {
  try {
    const data: DecisionEngineRequest = {
      ...req.body,
      partnerId: req.body.partnerId
    };

    if (!data.decisionContext) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'decisionContext is required'
      });
    }

    const result: OutputDecisionLog = await kdsaM2Service.analyzeDecision(data);
    res.json(result);
  } catch (error) {
    console.error('M2 Analysis Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M2',
      message: 'Failed to analyze decision'
    });
  }
});

/**
 * POST /api/kdsa/m2/premortem
 * Legacy Pre-mortem endpoint (backward compatibility)
 */
router.post('/m2/premortem', async (req: Request, res: Response) => {
  try {
    const data: PremortemRequest = req.body;
    const result = await kdsaM2Service.runPremortem(data);
    res.json(result);
  } catch (error) {
    console.error('M2 Premortem Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M2',
      message: 'Failed to run pre-mortem analysis'
    });
  }
});

/**
 * POST /api/kdsa/m2/detect-biases
 * Detect cognitive biases in text
 */
router.post('/m2/detect-biases', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'text is required'
      });
    }

    const biases = kdsaM2Service.detectBiases(text);
    res.json({
      biases_detected: biases.map(b => b.type),
      biases_detail: biases,
      count: biases.length
    });
  } catch (error) {
    console.error('M2 Bias Detection Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M2',
      message: 'Failed to detect biases'
    });
  }
});

/**
 * POST /api/kdsa/m2/evaluate-risk
 * Evaluate M1 risk flags and return de-biasing decision
 */
router.post('/m2/evaluate-risk', async (req: Request, res: Response) => {
  try {
    const m1RiskFlag: M1RiskFlag = req.body;

    if (!m1RiskFlag.atri_score) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'M1 Risk Flag data is required'
      });
    }

    const decision = kdsaM2Service.evaluateRiskFlags(m1RiskFlag);
    res.json(decision);
  } catch (error) {
    console.error('M2 Risk Evaluation Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M2',
      message: 'Failed to evaluate risk'
    });
  }
});

/**
 * GET /api/kdsa/m2/health
 * Health check endpoint for CaaS monitoring
 */
router.get('/m2/health', (req: Request, res: Response) => {
  res.json({
    status: 'Healthy',
    module: 'M2-DecisionEngine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    capabilities: [
      'bias_detection',
      'pre_mortem_analysis',
      'contrarian_analysis',
      'determinism_verification',
      'golden_thread_integration'
    ],
    compliance: [
      'EU AI Act Art 10',
      'EU AI Act Art 13',
      'EU AI Act Art 14',
      'DORA Pillar 3',
      'NIST AI RMF Map 1.2'
    ]
  });
});

// =============================================================================
// M3: GOVERNANCE & AUDIT ENDPOINTS
// =============================================================================

/**
 * POST /api/kdsa/m3/audit
 * Manual audit log entry
 */
router.post('/m3/audit', async (req: Request, res: Response) => {
  try {
    const { action, details, tags } = req.body;
    const id = await kdsaAuditService.logEvent({
      partnerId: req.body.partnerId,
      module: 'M3',
      action: action || 'Manual Entry',
      details: details || '',
      complianceTags: tags || ['Manual']
    });
    res.json({ success: true, auditId: id });
  } catch (error) {
    console.error('M3 Audit Log Error:', error);
    res.status(500).json({
      error: 'Audit Log Failed',
      module: 'M3'
    });
  }
});

/**
 * GET /api/kdsa/m3/audit-log/:decisionId
 * Retrieve audit log for a specific decision
 */
router.get('/m3/audit-log/:decisionId', async (req: Request, res: Response) => {
  try {
    const { decisionId } = req.params;
    const logs = await kdsaAuditService.getAllLogs();
    const relevantLogs = logs.filter(log =>
      log.details?.includes(decisionId)
    );

    if (relevantLogs.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No audit logs found for decision: ${decisionId}`
      });
    }

    res.json({
      decision_id: decisionId,
      logs: relevantLogs,
      immutability_proof: relevantLogs.map(l => l.hash),
      compliance_mapping: extractComplianceTags(relevantLogs)
    });
  } catch (error) {
    console.error('M3 Audit Log Retrieval Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      module: 'M3'
    });
  }
});

/**
 * GET /api/kdsa/m3/dora-pack
 * DORA Compliance Pack Export
 */
router.get('/m3/dora-pack', async (req: Request, res: Response) => {
  try {
    const logs = await kdsaAuditService.getAllLogs();

    // Generate Markdown Report
    let report = `# DORA CTPP-Ready Compliance Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Partner ID:** ${req.body.partnerId}\n`;
    report += `**Report Version:** 2.0 (Charter Compliant)\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This report demonstrates compliance with DORA (Digital Operational Resilience Act) and EU AI Act requirements through the KDSA Neurosymbolic GRC Engine.\n\n`;

    report += `## Module Activity Summary\n\n`;

    const m1Logs = logs.filter(l => l.module === 'M1');
    const m2Logs = logs.filter(l => l.module === 'M2');
    const m3Logs = logs.filter(l => l.module === 'M3');

    report += `| Module | Activity Count | Compliance Coverage |\n`;
    report += `| --- | --- | --- |\n`;
    report += `| M1 ACORE (Human Factor Sensing) | ${m1Logs.length} | DORA Pillar 4, EU AI Act Art 14 |\n`;
    report += `| M2 Decision Engine (Cognitive De-biasing) | ${m2Logs.length} | EU AI Act Art 13, DORA Pillar 3 |\n`;
    report += `| M3 Alexandra (Governance) | ${m3Logs.length} | EU AI Act Art 10, DORA Pillar 3 |\n\n`;

    report += `## Immutable Audit Ledger (SHA-256 Verified)\n\n`;
    report += `| Timestamp | Module | Action | Hash | Tags |\n`;
    report += `| --- | --- | --- | --- | --- |\n`;

    logs.slice(0, 50).forEach(log => {
      report += `| ${log.timestamp} | ${log.module} | ${log.action} | \`${log.hash.substring(0, 12)}...\` | ${log.complianceTags.join(', ')} |\n`;
    });

    const verification = await kdsaAuditService.verifyChain();
    report += `\n## Chain Integrity Verification\n\n`;
    report += `**Status:** ${verification.valid ? '✅ PASSED' : '❌ FAILED'}\n`;
    if (!verification.valid && verification.brokenAtId) {
      report += `**Broken at ID:** ${verification.brokenAtId}\n`;
    }
    report += `**Total Records:** ${logs.length}\n`;
    report += `**Verification Timestamp:** ${new Date().toISOString()}\n`;

    res.header('Content-Type', 'text/markdown');
    res.send(report);
  } catch (error) {
    console.error('DORA Pack Generation Error:', error);
    res.status(500).json({ error: 'Report Generation Failed' });
  }
});

/**
 * GET /api/kdsa/m3/verify-chain
 * Verify audit chain integrity
 */
router.get('/m3/verify-chain', async (req: Request, res: Response) => {
  try {
    const verification = await kdsaAuditService.verifyChain();
    res.json(verification);
  } catch (error) {
    console.error('Chain Verification Error:', error);
    res.status(500).json({
      error: 'Verification Failed',
      module: 'M3'
    });
  }
});

/**
 * GET /api/kdsa/m3/health
 * M3 Health check
 */
router.get('/m3/health', (req: Request, res: Response) => {
  res.json({
    status: 'Healthy',
    module: 'M3-Alexandra',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// COMBINED HEALTH CHECK
// =============================================================================

/**
 * GET /api/kdsa/health
 * Combined health check for all modules
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'Healthy',
    system: 'KDSA-v3.3',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    modules: {
      m1: { status: 'Healthy', name: 'ACORE Human Factor Sensing' },
      m2: { status: 'Healthy', name: 'Decision Engine (Cognitive De-biasing)' },
      m3: { status: 'Healthy', name: 'Alexandra (Governance)' }
    },
    goldenThread: {
      status: 'Active',
      flow: 'M1 → M2 → M3'
    }
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function determineM1PrimaryDriver(result: any): string {
  if (result.riskFlags.highChangeFatigue) return 'CHANGE_FATIGUE';
  if (result.riskFlags.lowPsychSafety) return 'LOW_PSYCHOLOGICAL_SAFETY';
  if (result.riskFlags.highJobStrain) return 'HIGH_JOB_STRAIN';
  return 'NONE';
}

function determineAtriZoneFromScore(score: number): string {
  if (score >= 85) return 'AMBIDEXTROUS';
  if (score >= 70) return 'RESILIENT';
  if (score >= 55) return 'STRAINED';
  return 'CRITICAL';
}

function generateTriggerConditions(result: any, data: ACOREAssessment): string[] {
  const conditions: string[] = [];

  if (result.orsScore < 55) conditions.push('ATRI_CRITICAL_ZONE');
  if (result.orsScore < 50) conditions.push('ORS_ENVIRONMENT_CONSTRAINT');
  if (result.riskFlags.highChangeFatigue) conditions.push('RACQ_CONSTRAINED_CAPACITY');

  // Check SCARF domains
  if (data.scarf) {
    if (data.scarf.status < 50) conditions.push('SCARF_STATUS_THREAT');
    if (data.scarf.certainty < 50) conditions.push('SCARF_CERTAINTY_THREAT');
    if (data.scarf.autonomy < 50) conditions.push('SCARF_AUTONOMY_THREAT');
    if (data.scarf.relatedness < 50) conditions.push('SCARF_RELATEDNESS_THREAT');
    if (data.scarf.fairness < 50) conditions.push('SCARF_FAIRNESS_THREAT');
  }

  return conditions as any;
}

function extractComplianceTags(logs: any[]): Record<string, number> {
  const tagCounts: Record<string, number> = {};
  logs.forEach(log => {
    log.complianceTags?.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return tagCounts;
}

export default router;
