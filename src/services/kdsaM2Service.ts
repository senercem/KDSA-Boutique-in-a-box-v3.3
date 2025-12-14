// =============================================================================
// KDSA M2 Decision Engine Service - Charter Compliant v2.0
// Implements Neurosymbolic GRC Engine per M2 Charter v3.1
// G-001, G-002, G-003 Remediation Complete
// =============================================================================

import { GoogleGenAI, Type } from "@google/genai";
import * as crypto from 'crypto';
import {
  PremortemRequest,
  PremortemResponse,
  M1RiskFlag,
  OutputDecisionLog,
  DebiasDecision,
  CognitiveBias,
  PreMortemResult,
  ContrarianResult,
  DeterminismReport,
  PreMortemRequest,
  ContrarianRequest,
  DecisionEngineRequest,
  M1InputFlagSummary,
  M2Recommendation,
  CognitiveBiasLog,
  PreMortemScenarioLog,
  DebiasProtocol,
  BiasType,
  BiasSeverity,
  RiskLevel,
  LimitingFactor,
  DeterminismTier,
  DecisionOutcome,
  AtriZone,
  identifyLimitingFactors,
  identifyScarfThreats,
  getMinimumScarfDomain,
  DEFAULT_COMPLIANCE_TAGS
} from '../types/kdsa.types';
import { kdsaAuditService } from './kdsaAuditService';

// Initialize Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Constants
const DEFAULT_SEED = 42;
const DETERMINISM_VERIFICATION_ITERATIONS = 3;
const MODEL = "gemini-2.5-flash";

// === BIAS DETECTION PATTERNS (M2 Charter v3.0 Section 13.2) ===
interface BiasPattern {
  pattern: RegExp;
  severity: BiasSeverity;
  description: string;
  mitigation: string;
}

const BIAS_PATTERNS: Record<BiasType, BiasPattern> = {
  [BiasType.Anchoring]: {
    pattern: /\$[\d,]+(\.\d+)?[kKmMbB]?|\d+%|\d{2,}[kKmMbB]/gi,
    severity: BiasSeverity.Medium,
    description: 'Specific numerical figures detected - potential anchoring bias',
    mitigation: 'Consider the Opposite: What if this number were 50% lower/higher?'
  },
  [BiasType.Overconfidence]: {
    pattern: /\b(definitely|certainly|guarantee|impossible|always|never|100%|zero chance)\b/gi,
    severity: BiasSeverity.High,
    description: 'Absolute language detected - potential overconfidence bias',
    mitigation: 'Pre-Mortem: Imagine this decision failed spectacularly. What went wrong?'
  },
  [BiasType.StatusQuo]: {
    pattern: /\b(current|existing|traditional|always done|usual|standard practice|we've always|never changed)\b/gi,
    severity: BiasSeverity.Low,
    description: 'Status quo references detected - potential resistance to change',
    mitigation: 'Consider: What would a new competitor do without legacy constraints?'
  },
  [BiasType.Confirmation]: {
    pattern: /\b(clearly|obviously|everyone knows|proven fact|undeniable|no question)\b/gi,
    severity: BiasSeverity.Medium,
    description: 'Assumed certainty detected - potential confirmation bias',
    mitigation: 'Seek Disconfirming Evidence: What data would change your mind?'
  },
  [BiasType.Availability]: {
    pattern: /\b(just happened|recently|last (week|month|quarter)|heard about|saw that)\b/gi,
    severity: BiasSeverity.Low,
    description: 'Recent/anecdotal references detected - potential availability bias',
    mitigation: 'Base Rate Check: What does the historical data show over longer periods?'
  },
  [BiasType.Groupthink]: {
    pattern: /\b(everyone agrees|unanimous|no objections|whole team thinks|all agreed)\b/gi,
    severity: BiasSeverity.High,
    description: 'Unanimous consensus language detected - potential groupthink',
    mitigation: "Devil's Advocate: Assign someone to argue the opposing position formally"
  },
  [BiasType.SunkCost]: {
    pattern: /\b(already invested|spent so much|too far to|can't stop now|wasted if)\b/gi,
    severity: BiasSeverity.Medium,
    description: 'Past investment justification detected - potential sunk cost fallacy',
    mitigation: 'Zero-Base Thinking: If starting fresh today, would you make this decision?'
  },
  [BiasType.Framing]: {
    pattern: /\b(opportunity|threat|gain|loss|risk|reward|upside|downside)\b/gi,
    severity: BiasSeverity.Low,
    description: 'Framing language detected - consider alternative framings',
    mitigation: 'Reframe: How would this look as an opportunity vs. a threat?'
  }
};

// === CORE SERVICE ===
export const kdsaM2Service = {
  // =========================================================================
  // DEBIASING RULE ENGINE (M2 Charter v3.1 Section 13)
  // Implements symbolic "IF-THEN" rules for cognitive circuit-breaker
  // =========================================================================

  /**
   * Evaluates M1 risk flags and determines required de-biasing protocols
   * Per M2 Charter v3.1 Section 13.2: Meehl-Dawes Doctrine implementation
   */
  evaluateRiskFlags(m1RiskFlag: M1RiskFlag): DebiasDecision {
    const decision: DebiasDecision = {
      decisionId: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      inputHash: this.computeHash(m1RiskFlag),
      requiredProtocols: [],
      riskLevel: RiskLevel.Low,
      primaryDriver: m1RiskFlag.primary_driver || '',
      limitingFactorsActive: [],
      scarfThreatDomains: []
    };

    // Extract key metrics from M1 input
    const atriScore = m1RiskFlag.atri_score;
    const scarfMinimum = getMinimumScarfDomain(m1RiskFlag.scarf_profile);
    const orisII = m1RiskFlag.component_scores.ors_ii;
    const simulation = m1RiskFlag.component_scores.simulation;
    const scarfCoefficient = m1RiskFlag.component_scores.scarf_coefficient;

    // Identify active limiting factors (Playbook v3.4 Appendix I.3)
    decision.limitingFactorsActive = identifyLimitingFactors(m1RiskFlag.component_scores);

    // Identify SCARF threat domains
    decision.scarfThreatDomains = identifyScarfThreats(m1RiskFlag.scarf_profile);

    // Primary rule: M1 risk_flag = TRUE triggers mandatory Pre-Mortem
    // Per M2 Charter v3.0 Section 14.4: "M1-M2 Golden Thread"
    if (m1RiskFlag.risk_flag) {
      decision.requiredProtocols = [DebiasProtocol.PreMortemMandatory];
      decision.riskLevel = this.determineRiskLevel(atriScore, scarfMinimum, decision.scarfThreatDomains.length);
      decision.primaryDriver = m1RiskFlag.primary_driver;
      return decision;
    }

    // Secondary rules: Evaluate conditions even when risk_flag is FALSE
    decision.requiredProtocols = this.determineProtocols(
      atriScore,
      m1RiskFlag.scarf_profile.certainty,
      scarfMinimum,
      orisII,
      simulation,
      decision.limitingFactorsActive
    );
    decision.riskLevel = this.determineRiskLevel(atriScore, scarfMinimum, decision.scarfThreatDomains.length);

    return decision;
  },

  /**
   * Determines required de-biasing protocols using pattern matching
   * Implements symbolic "IF-THEN" rules per Charter A.1
   */
  determineProtocols(
    atriScore: number,
    scarfCertainty: number,
    scarfMinimum: number,
    orisII: number,
    simulation: number,
    limitingFactors: LimitingFactor[]
  ): DebiasProtocol[] {
    // Rule 1: Critical ATRI zone (< 55)
    if (atriScore < 55) {
      return [DebiasProtocol.PreMortemMandatory];
    }

    // Rule 2: Low ATRI + Low SCARF certainty
    if (atriScore < 60 && scarfCertainty < 0.5) {
      return [DebiasProtocol.PreMortemMandatory];
    }

    // Rule 3: Any SCARF domain in threat state
    if (scarfMinimum < 0.5) {
      return [DebiasProtocol.PreMortemAdvisory, DebiasProtocol.ConsiderTheOpposite];
    }

    // Rule 4: Multiple limiting factors active
    if (limitingFactors.length >= 2) {
      return [DebiasProtocol.PreMortemAdvisory, DebiasProtocol.ConsiderTheOpposite];
    }

    // Rule 5: Single limiting factor
    if (limitingFactors.length === 1) {
      return [DebiasProtocol.ConsiderTheOpposite];
    }

    // Rule 6: Strained zone (55-69)
    if (atriScore < 70) {
      return [DebiasProtocol.ConsiderTheOpposite];
    }

    // Default: Standard processing
    return [DebiasProtocol.StandardAnalysis];
  },

  /**
   * Determines risk level based on ATRI score and SCARF threats
   */
  determineRiskLevel(atriScore: number, scarfMinimum: number, threatDomainCount: number): RiskLevel {
    if (atriScore < 55) return RiskLevel.Critical;
    if (atriScore < 60 && scarfMinimum < 0.5) return RiskLevel.Critical;
    if (threatDomainCount >= 3) return RiskLevel.High;
    if (atriScore < 70) return RiskLevel.High;
    if (scarfMinimum < 0.5) return RiskLevel.High;
    if (atriScore < 85) return RiskLevel.Medium;
    return RiskLevel.Low;
  },

  // =========================================================================
  // BIAS DETECTION (M2 Charter v3.0 Section 13.2)
  // =========================================================================

  /**
   * Detects cognitive biases in decision context text using regex patterns
   * Returns detailed bias information with mitigation strategies
   */
  detectBiases(text: string): CognitiveBias[] {
    const biases: CognitiveBias[] = [];

    if (!text || text.trim().length === 0) {
      return biases;
    }

    for (const [biasType, config] of Object.entries(BIAS_PATTERNS)) {
      const matches = text.match(config.pattern);
      if (matches && matches.length > 0) {
        biases.push({
          type: biasType as BiasType,
          severity: config.severity,
          description: config.description,
          mitigation: config.mitigation,
          evidence: matches.slice(0, 3).join(', ')
        });
      }
    }

    return biases;
  },

  /**
   * Simple bias detection (legacy format for backward compatibility)
   */
  detectBiasesSimple(text: string): string[] {
    return this.detectBiases(text).map(b => `${b.type} (${b.description})`);
  },

  // =========================================================================
  // GEMINI AI INTEGRATION (M2 Charter v3.1)
  // Temperature=0, seed-based generation for determinism
  // =========================================================================

  /**
   * Runs Pre-Mortem analysis with deterministic output
   * Per M2 Charter v3.1 Section 13.1 Workflow 2
   */
  async runPreMortemAnalysis(request: PreMortemRequest, seed: number = DEFAULT_SEED): Promise<PreMortemResult> {
    const prompt = this.buildPreMortemPrompt(request);
    const inputHash = this.computeHash(request);

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
        // Normalize probabilities to ensure they sum to ~1.0
        const total = scenarios.reduce((sum, s) => sum + s.probability, 0);
        if (total > 0) {
          scenarios = scenarios.map(s => ({
            ...s,
            probability: Math.round((s.probability / total) * 1000) / 1000
          }));
        }
      }

      return {
        decisionId: `dec-${Date.now()}`,
        scenarios,
        seed,
        inputHash,
        outputHash: this.computeHash(scenarios)
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
            description: "Key stakeholders resist change due to cultural inertia and fear of disruption to established workflows.",
            mitigation_strategy: "Implement structured change management with ADKAR framework. Conduct stakeholder mapping and address concerns proactively.",
            risk_category: "OPERATIONAL"
          },
          {
            title: "Resource Underestimation",
            probability: 0.35,
            description: "Project scope expanded beyond initial estimates, depleting resources and extending timelines.",
            mitigation_strategy: "Establish strict scope governance. Create buffer for unexpected requirements. Use agile methodology for flexibility.",
            risk_category: "FINANCIAL"
          },
          {
            title: "Market Timing Failure",
            probability: 0.30,
            description: "External market conditions shifted, making the initiative less relevant or valuable.",
            mitigation_strategy: "Continuous market monitoring. Build in pivot capabilities. Define clear go/no-go decision points.",
            risk_category: "STRATEGIC"
          }
        ],
        seed,
        inputHash,
        outputHash: this.computeHash("fallback")
      };
    }
  },

  /**
   * Runs Consider-the-Opposite (Contrarian) analysis
   * Per M2 Charter v3.1 Section 13.1 Workflow 1
   */
  async runContrarianAnalysis(request: ContrarianRequest, seed: number = DEFAULT_SEED): Promise<ContrarianResult> {
    const prompt = this.buildContrarianPrompt(request);
    const inputHash = this.computeHash(request);

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

      let result: Partial<ContrarianResult> = {};
      if (response.text) {
        result = JSON.parse(response.text);
      }

      return {
        counterArguments: result.counterArguments || [],
        alternativeHypothesis: result.alternativeHypothesis || '',
        disconfirmingEvidence: result.disconfirmingEvidence || '',
        recommendedAction: (result.recommendedAction as 'PROCEED' | 'MODIFY' | 'RECONSIDER') || 'RECONSIDER',
        seed,
        inputHash,
        outputHash: this.computeHash(result)
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
        outputHash: this.computeHash("fallback")
      };
    }
  },

  /**
   * Verifies output determinism by comparing hashes across multiple iterations
   * G-003 REMEDIATION: Classifies outputs into determinism tiers
   */
  async verifyDeterminism(request: PreMortemRequest, seed: number = DEFAULT_SEED): Promise<DeterminismReport> {
    const report: DeterminismReport = {
      verificationId: `ver-${Date.now()}`,
      iterations: DETERMINISM_VERIFICATION_ITERATIONS,
      seed,
      uniqueHashCount: 0,
      consistencyRate: 0,
      determinismTier: DeterminismTier.TIER_1_DETERMINISTIC,
      isFullyDeterministic: true,
      iterationHashes: []
    };

    const hashes: string[] = [];

    for (let i = 0; i < DETERMINISM_VERIFICATION_ITERATIONS; i++) {
      const result = await this.runPreMortemAnalysis(request, seed);
      hashes.push(result.outputHash);
      report.iterationHashes.push({ iteration: i + 1, hash: result.outputHash });
    }

    const uniqueHashes = new Set(hashes).size;
    const maxOccurrences = Math.max(...Object.values(
      hashes.reduce((acc, h) => {
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ));
    const consistencyRate = maxOccurrences / DETERMINISM_VERIFICATION_ITERATIONS;

    report.uniqueHashCount = uniqueHashes;
    report.consistencyRate = consistencyRate;

    // G-003: Determinism tier classification
    if (uniqueHashes === 1) {
      report.determinismTier = DeterminismTier.TIER_1_DETERMINISTIC;
    } else if (consistencyRate >= 0.95) {
      report.determinismTier = DeterminismTier.TIER_2_CONSTRAINED;
    } else {
      report.determinismTier = DeterminismTier.TIER_3_STOCHASTIC;
      console.warn(
        `STOCHASTIC OUTPUT DETECTED: VerificationId=${report.verificationId}, ConsistencyRate=${consistencyRate}, UniqueHashes=${uniqueHashes}`
      );
    }

    report.isFullyDeterministic = report.determinismTier === DeterminismTier.TIER_1_DETERMINISTIC;

    return report;
  },

  // =========================================================================
  // MAIN ANALYSIS WORKFLOW (Golden Thread Steps 3-8)
  // =========================================================================

  /**
   * Full decision analysis workflow implementing Golden Thread
   * Per Playbook v3.4 Appendix D.2
   */
  async analyzeDecision(request: DecisionEngineRequest): Promise<OutputDecisionLog> {
    // Create default M1 Risk Flag if not provided
    const m1RiskFlag: M1RiskFlag = request.m1RiskFlag || {
      risk_flag: false,
      primary_driver: '',
      atri_score: 75,
      atri_zone: AtriZone.Resilient,
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

    // === STEP 4-5: Ingest M1 Risk Flag (Golden Thread) ===
    // === STEP 6: Rule Engine Evaluation ===
    const debiasDecision = this.evaluateRiskFlags(m1RiskFlag);
    const detectedBiases = this.detectBiases(request.decisionContext);

    // Determine required workflows
    const requiresPreMortem = debiasDecision.requiredProtocols.some(
      p => p === DebiasProtocol.PreMortemMandatory || p === DebiasProtocol.PreMortemAdvisory
    );
    const requiresConsiderOpposite = debiasDecision.requiredProtocols.some(
      p => p === DebiasProtocol.ConsiderTheOpposite
    );

    // === STEP 7: Execute De-biasing Suite ===
    let preMortemResult: PreMortemResult | null = null;
    let contrarianResult: ContrarianResult | null = null;
    let determinismReport: DeterminismReport | null = null;

    if (requiresPreMortem) {
      const preMortemRequest: PreMortemRequest = {
        decisionContext: request.decisionContext,
        knownRisks: request.knownRisks,
        atriScore: m1RiskFlag.atri_score,
        atriZone: typeof m1RiskFlag.atri_zone === 'string' ? m1RiskFlag.atri_zone : m1RiskFlag.atri_zone.toString(),
        scarfThreatDomains: debiasDecision.scarfThreatDomains,
        limitingFactors: debiasDecision.limitingFactorsActive.map(l => l.toString()),
        detectedBiases: detectedBiases.map(b => b.type.toString())
      };

      preMortemResult = await this.runPreMortemAnalysis(preMortemRequest);

      // G-003: Verify determinism
      determinismReport = await this.verifyDeterminism(preMortemRequest);
    }

    if (requiresConsiderOpposite && request.initialConclusion) {
      const contrarianRequest: ContrarianRequest = {
        initialConclusion: request.initialConclusion,
        supportingEvidence: request.supportingEvidence,
        detectedBiases: detectedBiases.map(b => b.type.toString())
      };
      contrarianResult = await this.runContrarianAnalysis(contrarianRequest);
    }

    // Build Output Decision Log (G-002 Compliant)
    const outputLog = this.buildOutputDecisionLog(
      request,
      m1RiskFlag,
      debiasDecision,
      detectedBiases,
      preMortemResult,
      contrarianResult,
      determinismReport
    );

    // === STEP 8: Auto-Log to M3 Alexandra (Governance) ===
    await kdsaAuditService.logEvent({
      partnerId: request.partnerId,
      module: 'M2',
      action: 'Decision Analysis Completed',
      complianceTags: DEFAULT_COMPLIANCE_TAGS,
      details: JSON.stringify({
        decisionId: outputLog.decision_id,
        riskLevel: debiasDecision.riskLevel,
        biasesDetected: outputLog.biases_detected.length,
        determinismTier: outputLog.determinism_tier,
        outcome: outputLog.m2_recommendation.decision_outcome
      })
    });

    return outputLog;
  },

  /**
   * Builds the complete OutputDecisionLog structure (G-002 compliant)
   */
  buildOutputDecisionLog(
    request: DecisionEngineRequest,
    m1RiskFlag: M1RiskFlag,
    debiasDecision: DebiasDecision,
    detectedBiases: CognitiveBias[],
    preMortemResult: PreMortemResult | null,
    contrarianResult: ContrarianResult | null,
    determinismReport: DeterminismReport | null
  ): OutputDecisionLog {
    const determinismTier = determinismReport?.determinismTier || DeterminismTier.TIER_1_DETERMINISTIC;

    // Build causal path for logic trace (G-002 compliant)
    const causalPath = this.buildCausalPath(m1RiskFlag, debiasDecision, detectedBiases);

    // Build M1 Input Summary
    const m1InputFlag: M1InputFlagSummary = {
      risk_flag: m1RiskFlag.risk_flag,
      primary_driver: m1RiskFlag.primary_driver,
      atri_score: m1RiskFlag.atri_score,
      atri_zone: typeof m1RiskFlag.atri_zone === 'string' ? m1RiskFlag.atri_zone : m1RiskFlag.atri_zone.toString(),
      limiting_factors_active: debiasDecision.limitingFactorsActive.map(l => l.toString()),
      scarf_threat_domains: debiasDecision.scarfThreatDomains
    };

    // Build M2 Recommendation
    const m2Recommendation: M2Recommendation = {
      decision_outcome: this.determineDecisionOutcome(debiasDecision, determinismTier),
      determinism_level: determinismTier.toString(),
      logic_trace_id: `trace-${Date.now()}`,
      causal_path: causalPath,
      confidence_score: this.calculateConfidenceScore(determinismReport, detectedBiases.length)
    };

    // Build bias detail logs
    const biasesDetail: CognitiveBiasLog[] = detectedBiases.map(b => ({
      type: b.type.toString(),
      severity: b.severity.toString(),
      description: b.description,
      mitigation: b.mitigation,
      evidence: b.evidence
    }));

    // Build Pre-Mortem scenario logs
    const preMortemScenarios: PreMortemScenarioLog[] = preMortemResult?.scenarios || [];

    return {
      decision_id: request.decisionId || `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),

      m1_input_flag: m1InputFlag,

      debiasing_workflow_triggered: debiasDecision.requiredProtocols.map(p => p.toString()).join(', '),
      consider_opposite_completed: contrarianResult !== null,

      biases_detected: detectedBiases.map(b => b.type.toString()),
      biases_detail: biasesDetail,

      m2_recommendation: m2Recommendation,

      user_override: false,
      user_override_justification: undefined,

      pre_mortem_scenarios: preMortemScenarios,

      executive_summary: this.generateExecutiveSummary(
        debiasDecision,
        detectedBiases,
        preMortemResult,
        contrarianResult
      ),

      input_hash: preMortemResult?.inputHash || this.computeHash(request),
      output_hash: preMortemResult?.outputHash || '',
      seed: preMortemResult?.seed || DEFAULT_SEED,
      determinism_verified: determinismReport?.isFullyDeterministic ?? true,
      determinism_tier: determinismTier.toString(),

      compliance_tags: DEFAULT_COMPLIANCE_TAGS
    };
  },

  /**
   * Determines decision outcome based on risk level and determinism
   */
  determineDecisionOutcome(decision: DebiasDecision, tier: DeterminismTier): string {
    // G-003: Stochastic outputs require additional review
    if (tier === DeterminismTier.TIER_3_STOCHASTIC) {
      return DecisionOutcome.DELAY_PENDING_REVIEW;
    }

    if (decision.riskLevel === RiskLevel.Critical) {
      return DecisionOutcome.ABORT_RECOMMENDED;
    }

    if (decision.riskLevel === RiskLevel.High && decision.limitingFactorsActive.length >= 2) {
      return DecisionOutcome.DELAY_PENDING_REVIEW;
    }

    if (decision.riskLevel === RiskLevel.High || decision.riskLevel === RiskLevel.Medium) {
      return DecisionOutcome.PROCEED_WITH_CONTROLS;
    }

    return DecisionOutcome.PROCEED;
  },

  /**
   * Builds causal path for logic trace (G-002 compliant)
   */
  buildCausalPath(
    m1Flag: M1RiskFlag,
    decision: DebiasDecision,
    biases: CognitiveBias[]
  ): string[] {
    const path: string[] = [];

    // Node 1: M1 Input Analysis
    path.push(`M1_INPUT:ATRI=${m1Flag.atri_score}|Zone=${m1Flag.atri_zone}|RiskFlag=${m1Flag.risk_flag}`);

    // Node 2: Limiting Factor Evaluation
    if (decision.limitingFactorsActive.length > 0) {
      path.push(`LIMITING_FACTORS:${decision.limitingFactorsActive.join(',')}`);
    }

    // Node 3: SCARF Threat Analysis
    if (decision.scarfThreatDomains.length > 0) {
      path.push(`SCARF_THREATS:${decision.scarfThreatDomains.join(',')}`);
    }

    // Node 4: Bias Detection
    if (biases.length > 0) {
      path.push(`BIASES_DETECTED:${biases.map(b => b.type).join(',')}`);
    }

    // Node 5: Protocol Selection
    path.push(`PROTOCOLS:${decision.requiredProtocols.join(',')}`);

    // Node 6: Risk Assessment
    path.push(`RISK_LEVEL:${decision.riskLevel}`);

    return path;
  },

  /**
   * Calculates confidence score based on determinism and bias count
   */
  calculateConfidenceScore(report: DeterminismReport | null, biasCount: number): number {
    let baseScore = 1.0;

    if (report) {
      baseScore *= report.consistencyRate;
    }

    baseScore -= (biasCount * 0.05);

    return Math.max(0.0, Math.min(1.0, Math.round(baseScore * 100) / 100));
  },

  /**
   * Generates executive summary
   */
  generateExecutiveSummary(
    decision: DebiasDecision,
    biases: CognitiveBias[],
    preMortem: PreMortemResult | null,
    contrarian: ContrarianResult | null
  ): string {
    const parts: string[] = [];

    parts.push(`Risk Level: ${decision.riskLevel}`);

    if (decision.limitingFactorsActive.length > 0) {
      parts.push(`Limiting Factors: ${decision.limitingFactorsActive.join(', ')}`);
    }

    if (biases.length > 0) {
      parts.push(`Biases Detected: ${biases.map(b => b.type).join(', ')}`);
    }

    if (preMortem?.scenarios?.length) {
      const highestRisk = preMortem.scenarios.reduce(
        (max, s) => s.probability > max.probability ? s : max,
        preMortem.scenarios[0]
      );
      parts.push(`Primary Risk: ${highestRisk.title} (${Math.round(highestRisk.probability * 100)}%)`);
    }

    if (contrarian) {
      parts.push(`Contrarian Recommendation: ${contrarian.recommendedAction}`);
    }

    return parts.join(' | ');
  },

  // =========================================================================
  // PROMPT BUILDERS
  // =========================================================================

  buildPreMortemPrompt(request: PreMortemRequest): string {
    const scarfContext = request.scarfThreatDomains?.length
      ? `Active SCARF Threats: ${request.scarfThreatDomains.join(', ')}`
      : 'No active SCARF threats';

    const limitingContext = request.limitingFactors?.length
      ? `Active Limiting Factors: ${request.limitingFactors.join(', ')}`
      : 'No limiting factors active';

    return `
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
  },

  buildContrarianPrompt(request: ContrarianRequest): string {
    return `
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
  },

  // =========================================================================
  // UTILITIES
  // =========================================================================

  /**
   * Computes SHA-256 hash of input for determinism verification
   */
  computeHash(input: any): string {
    const json = JSON.stringify(input);
    return crypto.createHash('sha256').update(json).digest('hex');
  },

  // =========================================================================
  // LEGACY API (Backward Compatibility)
  // =========================================================================

  /**
   * Legacy runPremortem function for backward compatibility
   */
  async runPremortem(req: PremortemRequest): Promise<PremortemResponse> {
    // Use new analysis workflow
    const result = await this.analyzeDecision({
      partnerId: req.partnerId,
      decisionContext: req.context,
      knownRisks: req.knownRisks,
      m1RiskFlag: req.m1RiskFlag,
      initialConclusion: req.initialConclusion,
      supportingEvidence: req.supportingEvidence
    });

    // Convert to legacy format
    return {
      decisionId: result.decision_id,
      detectedBiases: result.biases_detected,
      scenarios: result.pre_mortem_scenarios.map(s => ({
        scenario: s.title,
        probability: s.probability < 1 ? `${Math.round(s.probability * 100)}%` : s.probability.toString(),
        impact: s.risk_category,
        mitigation: s.mitigation_strategy
      })),
      auditHash: result.input_hash
    };
  }
};
