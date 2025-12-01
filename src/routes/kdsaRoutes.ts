
import { Router, Request, Response, NextFunction } from 'express';
import { kdsaM1Service } from '../services/kdsaM1Service';
import { kdsaM2Service } from '../services/kdsaM2Service';
import { kdsaAuditService } from '../services/kdsaAuditService';
import { ACOREAssessment, PremortemRequest } from '../types/kdsa.types';

const router = Router();

// Middleware: Mock Partner Authentication
const partnerAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing x-api-key' });
  }
  // In production, validate against Firestore 'companies' collection
  req.body.partnerId = 'partner-123'; // Mock injection
  next();
};

// Apply Auth
router.use(partnerAuth);

/**
 * M1: ACORE Sensing
 * POST /api/kdsa/m1/assess
 */
router.post('/m1/assess', async (req: Request, res: Response) => {
  try {
    const data: ACOREAssessment = req.body;
    const result = await kdsaM1Service.processAssessment(data);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error (M1)' });
  }
});

/**
 * M2: Decision Engine
 * POST /api/kdsa/m2/premortem
 */
router.post('/m2/premortem', async (req: Request, res: Response) => {
  try {
    const data: PremortemRequest = req.body;
    const result = await kdsaM2Service.runPremortem(data);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error (M2)' });
  }
});

/**
 * M3: Manual Audit Log
 * POST /api/kdsa/m3/audit
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
    res.status(500).json({ error: 'Audit Log Failed' });
  }
});

/**
 * M3: DORA Compliance Pack Export
 * GET /api/kdsa/m3/dora-pack
 */
router.get('/m3/dora-pack', async (req: Request, res: Response) => {
  try {
    const logs = await kdsaAuditService.getAllLogs();
    
    // Generate Markdown Report
    let report = `# DORA CTPP-Ready Compliance Report\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Partner ID:** ${req.body.partnerId}\n\n`;
    report += `## Immutable Audit Ledger (SHA-256 Verified)\n\n`;
    report += `| Timestamp | Module | Action | Hash | Tags |\n`;
    report += `| --- | --- | --- | --- | --- |\n`;
    
    logs.forEach(log => {
      report += `| ${log.timestamp} | ${log.module} | ${log.action} | \`${log.hash.substring(0,8)}...\` | ${log.complianceTags.join(', ')} |\n`;
    });

    const verification = await kdsaAuditService.verifyChain();
    report += `\n**Chain Integrity Check:** ${verification.valid ? 'PASSED ✅' : 'FAILED ❌'}\n`;

    res.header('Content-Type', 'text/markdown');
    res.send(report);
  } catch (error) {
    res.status(500).json({ error: 'Report Generation Failed' });
  }
});

export default router;
