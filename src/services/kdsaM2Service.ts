
import { GoogleGenAI, Type } from "@google/genai";
import { PremortemRequest, PremortemResponse } from '../types/kdsa.types';
import { kdsaAuditService } from './kdsaAuditService';

// Initialize Gemini (In a real CaaS, this would be injected)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const kdsaM2Service = {
  /**
   * Checks for cognitive biases using Regex heuristics
   */
  detectBiases(text: string): string[] {
    const biases: string[] = [];
    
    // Anchoring Bias: Looking for specific currency amounts (e.g., $10M, $500k)
    const anchoringRegex = /\$[\d]+(\.\d+)?[kMB]?/i;
    if (anchoringRegex.test(text)) {
      biases.push('Anchoring Bias (Specific financial figures detected)');
    }

    // Overconfidence Bias: Looking for absolute terms
    const confidenceRegex = /\b(definitely|certainly|guarantee|impossible|always)\b/i;
    if (confidenceRegex.test(text)) {
      biases.push('Overconfidence Bias (Absolute language detected)');
    }

    return biases;
  },

  /**
   * Runs the Golden Thread: Detect Bias -> Gemini Pre-mortem -> Auto-Log to M3
   */
  async runPremortem(req: PremortemRequest): Promise<PremortemResponse> {
    // 1. Cognitive Circuit Breaker (Bias Detection)
    const detectedBiases = this.detectBiases(req.context);

    // 2. Construct Prompt
    const riskContext = req.acoreRiskProfile 
      ? `Human-Factor Risk Level: ${req.acoreRiskProfile.riskLevel}. Flags: ${JSON.stringify(req.acoreRiskProfile.riskFlags)}`
      : 'Human-Factor Risk data unavailable.';

    const prompt = `
      Context: ${req.context}
      Internal Risks: ${riskContext}
      Detected Biases: ${detectedBiases.join(', ')}
      
      Task: Perform a 'Pre-mortem'. Assume the project failed 1 year from now. 
      Generate 3 failure scenarios and mitigations.
    `;

    // 3. Call Gemini
    // Note: Simplified call structure for the backend service context
    let scenarios = [];
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scenario: { type: Type.STRING },
                probability: { type: Type.STRING },
                impact: { type: Type.STRING },
                mitigation: { type: Type.STRING }
              }
            }
          }
        }
      });
      scenarios = response.text ? JSON.parse(response.text) : [];
    } catch (e) {
      console.error("Gemini Error", e);
      // Fallback if AI fails, to ensure system stability
      scenarios = [{ scenario: "AI Service Interruption", probability: "Low", impact: "High", mitigation: "Manual Review" }];
    }

    // 4. Golden Thread: Auto-Log to M3 (Governance)
    const auditId = await kdsaAuditService.logEvent({
      partnerId: req.partnerId,
      module: 'M2',
      action: 'Pre-mortem Generated',
      complianceTags: ['EU AI Act Art 14', 'DORA Pillar 3'],
      details: `Decision Context: ${req.context.substring(0, 50)}... Biases: ${detectedBiases.length}`
    });

    return {
      decisionId: `dec-${Date.now()}`,
      detectedBiases,
      scenarios,
      auditHash: auditId // Returning the ID/Hash to the user proves it was logged
    };
  }
};
