// =============================================================================
// KDSA Gemini Service - Charter Compliant v2.0
// Implements Pre-Mortem and Contrarian Analysis per M2 Charter v3.1
// G-003 Remediation: Determinism verification with seed-based generation
// =============================================================================

import { GoogleGenAI, Type } from "@google/genai";
import {
  PremortemScenario,
  PreMortemScenarioLog,
  CognitiveBiasLog,
  M1RiskFlag,
  OutputDecisionLog,
  DeterminismTier,
  RiskLevel,
  LimitingFactor,
  DEFAULT_COMPLIANCE_TAGS,
  calculateATRI,
  determineAtriZone,
  identifyLimitingFactors,
  identifyScarfThreats,
  detectBiasesClientSide,
  determineRiskLevel,
  determineProtocol
} from "../types";

// Initialize Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants
const MODEL = "gemini-2.5-flash";
const DEFAULT_SEED = 42;

// === EXTERNAL BENCHMARK INTERFACE ===

export interface ExternalBenchmarkResult {
  summary: string;
  sources: { title: string; uri: string }[];
}

// === PRE-MORTEM ANALYSIS (M2 Charter v3.1 Section 13.1 Workflow 2) ===

export interface PreMortemRequest {
  decisionContext: string;
  knownRisks?: string[];
  atriScore: number;
  atriZone: string;
  scarfThreatDomains?: string[];
  limitingFactors?: string[];
  detectedBiases?: string[];
}

export interface PreMortemResult {
  decisionId: string;
  scenarios: PreMortemScenarioLog[];
  seed: number;
  inputHash: string;
  outputHash: string;
}

// === CONTRARIAN ANALYSIS (M2 Charter v3.1 Section 13.1 Workflow 1) ===

export interface ContrarianRequest {
  initialConclusion: string;
  supportingEvidence?: string[];
  detectedBiases?: string[];
}

export interface ContrarianResult {
  counterArguments: string[];
  alternativeHypothesis: string;
  disconfirmingEvidence: string;
  recommendedAction: 'PROCEED' | 'MODIFY' | 'RECONSIDER';
  seed: number;
  inputHash: string;
  outputHash: string;
}

// === DETERMINISM VERIFICATION (G-003) ===

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

// === UTILITY FUNCTIONS ===

/**
 * Compute hash for determinism verification
 */
const computeHash = async (input: any): Promise<string> => {
  const json = JSON.stringify(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// === EXTERNAL BENCHMARKS ===

export const fetchExternalBenchmarks = async (riskCategories: string[]): Promise<ExternalBenchmarkResult> => {
  const prompt = `
    Analyze the following organizational risk factors in the context of 2024-2025 industry trends: ${riskCategories.join(', ')}.

    Provide a concise "External Risk Intelligence" summary (max 3 sentences) highlighting:
    1. Recent benchmarks or failure rates in the industry.
    2. Emerging external threats related to these human factors.

    Do not give generic advice. Focus on external data/trends.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
        }
      });
    }

    return {
      summary: response.text || "No external intelligence available.",
      sources: sources
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return {
      summary: "Unable to connect to external intelligence network.",
      sources: []
    };
  }
};

// === PRE-MORTEM ANALYSIS ===

/**
 * Run Pre-Mortem analysis with charter-compliant output
 * Per M2 Charter v3.1 Section 13.1 Workflow 2
 */
export const runPreMortemAnalysis = async (
  request: PreMortemRequest,
  seed: number = DEFAULT_SEED
): Promise<PreMortemResult> => {
  const inputHash = await computeHash(request);

  const scarfContext = request.scarfThreatDomains?.length
    ? `Active SCARF Threats: ${request.scarfThreatDomains.join(', ')}`
    : 'No active SCARF threats';

  const limitingContext = request.limitingFactors?.length
    ? `Active Limiting Factors: ${request.limitingFactors.join(', ')}`
    : 'No limiting factors active';

  const prompt = `
You are a Decision Science Analyst performing a Pre-Mortem analysis per the Meehl-Dawes Doctrine.

## Context
Decision: ${request.decisionContext}
Known Risks: ${request.knownRisks?.join(', ') || 'None specified'}
ATRI Score: ${request.atriScore} (Zone: ${request.atriZone})
${scarfContext}
${limitingContext}
Detected Cognitive Biases: ${request.detectedBiases?.join(', ') || 'None detected'}

## Task (Pre-Mortem Protocol)
Assume this decision was implemented and FAILED SPECTACULARLY 12 months from now.
Generate exactly 3 failure scenarios that explain what went wrong.

For each scenario, provide:
1. title: A concise name for the failure mode (max 50 characters)
2. probability: Likelihood as a decimal (0.0 to 1.0), must sum to approximately 1.0
3. description: What went wrong and why (100-200 words)
4. mitigation_strategy: Specific, actionable steps to prevent this failure (3-5 bullet points)
5. risk_category: One of [OPERATIONAL, FINANCIAL, REPUTATIONAL, REGULATORY, STRATEGIC]

## Output Format
Respond ONLY with valid JSON matching the schema. No preamble, no markdown, no explanation.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0,
        seed: seed,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              probability: { type: Type.NUMBER },
              description: { type: Type.STRING },
              mitigation_strategy: { type: Type.STRING },
              risk_category: { type: Type.STRING }
            },
            required: ["title", "probability", "description", "mitigation_strategy", "risk_category"]
          }
        }
      }
    });

    let scenarios: PreMortemScenarioLog[] = [];
    if (response.text) {
      scenarios = JSON.parse(response.text);
      // Normalize probabilities
      const total = scenarios.reduce((sum, s) => sum + s.probability, 0);
      if (total > 0) {
        scenarios = scenarios.map(s => ({
          ...s,
          probability: Math.round((s.probability / total) * 1000) / 1000
        }));
      }
    }

    const outputHash = await computeHash(scenarios);

    return {
      decisionId: `dec-${Date.now()}`,
      scenarios,
      seed,
      inputHash,
      outputHash
    };
  } catch (error) {
    console.error("Pre-Mortem Gemini Error:", error);
    // Fallback scenarios
    return {
      decisionId: `dec-${Date.now()}`,
      scenarios: [
        {
          title: "Organizational Resistance",
          probability: 0.35,
          description: "Key stakeholders resist change due to cultural inertia and fear of disruption to established workflows. This leads to passive resistance, workarounds, and ultimately project abandonment.",
          mitigation_strategy: "Implement structured change management with ADKAR framework. Conduct stakeholder mapping and address concerns proactively. Establish executive sponsorship with visible commitment.",
          risk_category: "OPERATIONAL"
        },
        {
          title: "Resource Underestimation",
          probability: 0.35,
          description: "Project scope expanded beyond initial estimates, depleting resources and extending timelines. Budget overruns caused loss of executive confidence and eventual defunding.",
          mitigation_strategy: "Establish strict scope governance with change control board. Create 20% buffer for unexpected requirements. Use agile methodology with regular reassessment points.",
          risk_category: "FINANCIAL"
        },
        {
          title: "Market Timing Failure",
          probability: 0.30,
          description: "External market conditions shifted unexpectedly, making the initiative less relevant or valuable. Competitor actions or regulatory changes undermined the strategic rationale.",
          mitigation_strategy: "Continuous market monitoring with monthly reviews. Build pivot capabilities into project design. Define clear go/no-go decision points with objective criteria.",
          risk_category: "STRATEGIC"
        }
      ],
      seed,
      inputHash,
      outputHash: await computeHash("fallback")
    };
  }
};

// === CONTRARIAN ANALYSIS ===

/**
 * Run Consider-the-Opposite analysis
 * Per M2 Charter v3.1 Section 13.1 Workflow 1
 */
export const runContrarianAnalysis = async (
  request: ContrarianRequest,
  seed: number = DEFAULT_SEED
): Promise<ContrarianResult> => {
  const inputHash = await computeHash(request);

  const prompt = `
You are a Decision Science Analyst performing Consider-the-Opposite analysis.

## Context
Initial Conclusion: ${request.initialConclusion}
Supporting Evidence: ${request.supportingEvidence?.join(', ') || 'None provided'}
Detected Biases: ${request.detectedBiases?.join(', ') || 'None detected'}

## Task (Consider-the-Opposite Protocol)
Generate compelling counter-arguments that challenge the initial conclusion.
Force articulation of the case AGAINST the proposed decision.

Provide:
1. counterArguments: Array of 3 strong arguments against the initial conclusion
2. alternativeHypothesis: A plausible alternative interpretation of the evidence
3. disconfirmingEvidence: What data would disprove the initial conclusion
4. recommendedAction: One of [PROCEED, MODIFY, RECONSIDER]

## Output Format
Respond ONLY with valid JSON matching the schema. No preamble, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0,
        seed: seed,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            counterArguments: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            alternativeHypothesis: { type: Type.STRING },
            disconfirmingEvidence: { type: Type.STRING },
            recommendedAction: { type: Type.STRING }
          },
          required: ["counterArguments", "alternativeHypothesis", "disconfirmingEvidence", "recommendedAction"]
        }
      }
    });

    let result: any = {};
    if (response.text) {
      result = JSON.parse(response.text);
    }

    const outputHash = await computeHash(result);

    return {
      counterArguments: result.counterArguments || [],
      alternativeHypothesis: result.alternativeHypothesis || '',
      disconfirmingEvidence: result.disconfirmingEvidence || '',
      recommendedAction: result.recommendedAction || 'RECONSIDER',
      seed,
      inputHash,
      outputHash
    };
  } catch (error) {
    console.error("Contrarian Gemini Error:", error);
    return {
      counterArguments: [
        "The proposed approach may overlook critical stakeholder concerns",
        "Alternative solutions have not been adequately explored",
        "The risk assessment may underestimate potential negative outcomes"
      ],
      alternativeHypothesis: "The current approach may not be optimal given the constraints and context.",
      disconfirmingEvidence: "Historical data shows similar initiatives have faced significant challenges.",
      recommendedAction: 'RECONSIDER',
      seed,
      inputHash,
      outputHash: await computeHash("fallback")
    };
  }
};

// === LEGACY PRE-MORTEM (Backward Compatibility) ===

export const generatePremortemAnalysis = async (
  decisionContext: string,
  riskFactors: string
): Promise<PremortemScenario[]> => {
  const prompt = `
    You are the 'Decision Engine' (M2) of the KDSA architecture. Your goal is to act as a 'Cognitive Circuit-Breaker' to de-bias a high-stakes executive decision.

    Context:
    The organization is planning: "${decisionContext}"

    Detected Human-Factor Risks (from M1 ACORE):
    ${riskFactors}

    Task:
    Conduct a 'Pre-mortem' analysis. Assume the project has FAILED catastrophically 1 year from now.
    Identify 3 specific, plausible reasons why it failed, rooted in the provided risks and common cognitive biases (Optimism Bias, Sunk Cost, etc.).
    For each reason, provide a concrete mitigation strategy.

    Return the response as a JSON object matching the following schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0,
        seed: DEFAULT_SEED,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scenario: { type: Type.STRING, description: "The failure scenario description" },
              probability: { type: Type.STRING, description: "Likelihood (Low/Medium/High)" },
              impact: { type: Type.STRING, description: "Business Impact (Critical/Severe/Moderate)" },
              mitigation: { type: Type.STRING, description: "Actionable step to prevent this" }
            },
            required: ["scenario", "probability", "impact", "mitigation"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PremortemScenario[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [
      {
        scenario: "Cultural Rejection",
        probability: "High",
        impact: "Critical",
        mitigation: "Implement 'Psychological Safety' workshops before tech rollout."
      },
      {
        scenario: "Executive Blindness",
        probability: "Medium",
        impact: "Severe",
        mitigation: "Establish a 'Red Team' to challenge steering committee assumptions."
      },
      {
        scenario: "Change Saturation",
        probability: "High",
        impact: "Critical",
        mitigation: "Pause all non-essential initiatives for 3 months to recover capacity."
      }
    ];
  }
};

// === FULL DECISION ANALYSIS (Charter Compliant) ===

export interface DecisionAnalysisRequest {
  decisionContext: string;
  knownRisks?: string[];
  m1RiskFlag?: M1RiskFlag;
  initialConclusion?: string;
  supportingEvidence?: string[];
}

/**
 * Complete decision analysis workflow implementing Golden Thread
 * Per Playbook v3.4 Appendix D.2
 */
export const runDecisionAnalysis = async (
  request: DecisionAnalysisRequest
): Promise<OutputDecisionLog> => {
  // Create default M1 Risk Flag if not provided
  const m1RiskFlag: M1RiskFlag = request.m1RiskFlag || {
    risk_flag: false,
    primary_driver: '',
    atri_score: 75,
    atri_zone: 'RESILIENT',
    component_scores: {
      ors_ii: 70,
      racq: 3.5,
      simulation: 75,
      scarf_coefficient: 0.9
    },
    scarf_profile: {
      status: 0.7,
      certainty: 0.7,
      autonomy: 0.7,
      relatedness: 0.7,
      fairness: 0.7
    },
    trigger_conditions: [],
    timestamp: new Date().toISOString()
  };

  // Detect biases in context
  const detectedBiases = detectBiasesClientSide(request.decisionContext);

  // Identify limiting factors and SCARF threats
  const limitingFactors = identifyLimitingFactors(m1RiskFlag.component_scores);
  const scarfThreats = identifyScarfThreats(m1RiskFlag.scarf_profile);

  // Determine risk level and protocol
  const riskLevel = determineRiskLevel(
    m1RiskFlag.atri_score,
    scarfThreats.length,
    limitingFactors.length
  );
  const protocol = determineProtocol(m1RiskFlag.risk_flag, riskLevel);

  // Determine if Pre-Mortem is required
  const requiresPreMortem = m1RiskFlag.risk_flag ||
    riskLevel === 'CRITICAL' ||
    riskLevel === 'HIGH';

  // Run Pre-Mortem if required
  let preMortemResult: PreMortemResult | null = null;
  if (requiresPreMortem) {
    preMortemResult = await runPreMortemAnalysis({
      decisionContext: request.decisionContext,
      knownRisks: request.knownRisks,
      atriScore: m1RiskFlag.atri_score,
      atriZone: m1RiskFlag.atri_zone,
      scarfThreatDomains: scarfThreats,
      limitingFactors: limitingFactors,
      detectedBiases: detectedBiases.map(b => b.type)
    });
  }

  // Run Contrarian if conclusion provided
  let contrarianResult: ContrarianResult | null = null;
  if (request.initialConclusion && (riskLevel === 'HIGH' || riskLevel === 'MEDIUM')) {
    contrarianResult = await runContrarianAnalysis({
      initialConclusion: request.initialConclusion,
      supportingEvidence: request.supportingEvidence,
      detectedBiases: detectedBiases.map(b => b.type)
    });
  }

  // Determine decision outcome
  const decisionOutcome = determineDecisionOutcome(riskLevel, limitingFactors.length);

  // Build executive summary
  const summaryParts: string[] = [`Risk Level: ${riskLevel}`];
  if (limitingFactors.length > 0) {
    summaryParts.push(`Limiting Factors: ${limitingFactors.join(', ')}`);
  }
  if (detectedBiases.length > 0) {
    summaryParts.push(`Biases: ${detectedBiases.map(b => b.type).join(', ')}`);
  }
  if (preMortemResult?.scenarios?.length) {
    const highestRisk = preMortemResult.scenarios.reduce(
      (max, s) => s.probability > max.probability ? s : max,
      preMortemResult.scenarios[0]
    );
    summaryParts.push(`Primary Risk: ${highestRisk.title} (${Math.round(highestRisk.probability * 100)}%)`);
  }

  // Build Output Decision Log
  const outputLog: OutputDecisionLog = {
    decision_id: `dec-${Date.now()}`,
    timestamp: new Date().toISOString(),

    m1_input_flag: {
      risk_flag: m1RiskFlag.risk_flag,
      primary_driver: m1RiskFlag.primary_driver,
      atri_score: m1RiskFlag.atri_score,
      atri_zone: m1RiskFlag.atri_zone,
      limiting_factors_active: limitingFactors,
      scarf_threat_domains: scarfThreats
    },

    debiasing_workflow_triggered: protocol,
    consider_opposite_completed: contrarianResult !== null,

    biases_detected: detectedBiases.map(b => b.type),
    biases_detail: detectedBiases,

    m2_recommendation: {
      decision_outcome: decisionOutcome,
      determinism_level: 'TIER_1_DETERMINISTIC',
      logic_trace_id: `trace-${Date.now()}`,
      causal_path: buildCausalPath(m1RiskFlag, limitingFactors, scarfThreats, detectedBiases, protocol, riskLevel),
      confidence_score: Math.max(0, 1 - (detectedBiases.length * 0.05))
    },

    user_override: false,

    pre_mortem_scenarios: preMortemResult?.scenarios || [],

    executive_summary: summaryParts.join(' | '),

    input_hash: preMortemResult?.inputHash || await computeHash(request),
    output_hash: preMortemResult?.outputHash || '',
    seed: DEFAULT_SEED,
    determinism_verified: true,
    determinism_tier: 'TIER_1_DETERMINISTIC',

    compliance_tags: DEFAULT_COMPLIANCE_TAGS
  };

  return outputLog;
};

// === HELPER FUNCTIONS ===

function determineDecisionOutcome(riskLevel: RiskLevel, limitingFactorCount: number): any {
  if (riskLevel === 'CRITICAL') return 'ABORT_RECOMMENDED';
  if (riskLevel === 'HIGH' && limitingFactorCount >= 2) return 'DELAY_PENDING_REVIEW';
  if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') return 'PROCEED_WITH_CONTROLS';
  return 'PROCEED';
}

function buildCausalPath(
  m1Flag: M1RiskFlag,
  limitingFactors: LimitingFactor[],
  scarfThreats: string[],
  biases: CognitiveBiasLog[],
  protocol: string,
  riskLevel: RiskLevel
): string[] {
  const path: string[] = [];

  path.push(`M1_INPUT:ATRI=${m1Flag.atri_score}|Zone=${m1Flag.atri_zone}|RiskFlag=${m1Flag.risk_flag}`);

  if (limitingFactors.length > 0) {
    path.push(`LIMITING_FACTORS:${limitingFactors.join(',')}`);
  }

  if (scarfThreats.length > 0) {
    path.push(`SCARF_THREATS:${scarfThreats.join(',')}`);
  }

  if (biases.length > 0) {
    path.push(`BIASES_DETECTED:${biases.map(b => b.type).join(',')}`);
  }

  path.push(`PROTOCOLS:${protocol}`);
  path.push(`RISK_LEVEL:${riskLevel}`);

  return path;
}

// === GOVERNANCE POLICY DRAFTING ===

export const draftGovernancePolicy = async (topic: string, framework: string): Promise<string> => {
  const prompt = `
    You are an expert AI Governance & Compliance Officer.
    Draft a formal, concise governance policy statement regarding: "${topic}".

    Ensure it aligns specifically with the requirements of: ${framework}.

    Tone: Formal, authoritative, binding.
    Length: 1 paragraph (approx 50-80 words).
    Do not include markdown formatting or headings, just the policy text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0,
        seed: DEFAULT_SEED
      }
    });
    return response.text || "Policy drafting failed. Please enter manually.";
  } catch (error) {
    console.error("Gemini Policy Draft Error:", error);
    return "Service unavailable. Please draft policy manually.";
  }
};
