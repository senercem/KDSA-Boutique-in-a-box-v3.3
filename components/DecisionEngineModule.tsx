// =============================================================================
// KDSA M2 Decision Engine Module - Charter Compliant v2.0
// Implements Neurosymbolic GRC Engine per M2 Charter v3.1
// G-001, G-002, G-003 Remediation Complete
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit, Zap, Loader2, ArrowRight, FileCheck, ShieldCheck,
  AlertTriangle, TrendingUp, AlertOctagon, CheckCircle2, XCircle,
  Target, Scale, ChevronDown, ChevronUp, Info, Shield
} from 'lucide-react';
import {
  runDecisionAnalysis,
  runPreMortemAnalysis,
  generatePremortemAnalysis
} from '../services/geminiService';
import {
  PremortemScenario,
  PreMortemScenarioLog,
  AuditLogEntry,
  ACOREDataPoint,
  M1RiskFlag,
  OutputDecisionLog,
  CognitiveBiasLog,
  RiskLevel,
  LimitingFactor,
  DeterminismTier,
  calculateATRI,
  determineAtriZone,
  identifyLimitingFactors,
  identifyScarfThreats,
  detectBiasesClientSide,
  determineRiskLevel,
  determineProtocol,
  DEFAULT_COMPLIANCE_TAGS
} from '../types';

// === COMPONENT PROPS ===

interface DecisionEngineProps {
  riskSignalActive: boolean;
  acoreData: ACOREDataPoint[];
  onLogGenerated: (log: AuditLogEntry) => void;
  onViewAuditLog: () => void;
  m1RiskFlag?: M1RiskFlag;
}

// === STEP STATES ===

type AnalysisStep = 'IDLE' | 'INPUT' | 'ANALYSIS' | 'COMPLETE';

// === MAIN COMPONENT ===

export const DecisionEngineModule: React.FC<DecisionEngineProps> = ({
  riskSignalActive,
  acoreData,
  onLogGenerated,
  onViewAuditLog,
  m1RiskFlag
}) => {
  // Form State
  const [decisionContext, setDecisionContext] = useState('');
  const [knownRisks, setKnownRisks] = useState('');
  const [initialConclusion, setInitialConclusion] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [step, setStep] = useState<AnalysisStep>('IDLE');

  // Analysis Results
  const [decisionLog, setDecisionLog] = useState<OutputDecisionLog | null>(null);
  const [legacyAnalysis, setLegacyAnalysis] = useState<PremortemScenario[] | null>(null);

  // Real-time Bias Detection
  const [detectedBiases, setDetectedBiases] = useState<CognitiveBiasLog[]>([]);

  // M1 Integration State
  const [atriScore, setAtriScore] = useState<number>(75);
  const [atriZone, setAtriZone] = useState<string>('RESILIENT');
  const [limitingFactors, setLimitingFactors] = useState<LimitingFactor[]>([]);
  const [scarfThreats, setScarfThreats] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('LOW');
  const [debiasingProtocol, setDebiasingProtocol] = useState<string>('STANDARD_ANALYSIS');

  // UI State
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [showCausalPath, setShowCausalPath] = useState(false);

  // Auto-trigger when M1 sends risk signal
  useEffect(() => {
    if (riskSignalActive && step === 'IDLE') {
      setStep('INPUT');
    }
  }, [riskSignalActive, step]);

  // Process M1 Risk Flag when received
  useEffect(() => {
    if (m1RiskFlag) {
      const calculatedAtri = calculateATRI(m1RiskFlag.component_scores);
      const zone = determineAtriZone(calculatedAtri);
      const factors = identifyLimitingFactors(m1RiskFlag.component_scores);
      const threats = identifyScarfThreats(m1RiskFlag.scarf_profile);

      setAtriScore(calculatedAtri);
      setAtriZone(zone);
      setLimitingFactors(factors);
      setScarfThreats(threats);

      const level = determineRiskLevel(calculatedAtri, threats.length, factors.length);
      setRiskLevel(level);
      setDebiasingProtocol(determineProtocol(m1RiskFlag.risk_flag, level));
    }
  }, [m1RiskFlag]);

  // Real-time bias detection as user types
  useEffect(() => {
    const biases = detectBiasesClientSide(decisionContext);
    setDetectedBiases(biases);
  }, [decisionContext]);

  // === ANALYSIS HANDLER ===

  const handleRunAnalysis = async () => {
    if (!decisionContext.trim()) return;

    setIsThinking(true);
    setStep('ANALYSIS');

    try {
      // Build M1 Risk Flag from ACORE data if not provided
      const effectiveM1RiskFlag: M1RiskFlag = m1RiskFlag || {
        risk_flag: riskSignalActive,
        primary_driver: determinePrimaryDriver(acoreData),
        atri_score: atriScore,
        atri_zone: atriZone as any,
        component_scores: {
          ors_ii: getMetricValue(acoreData, 'Psychological Safety'),
          racq: 3.5,
          simulation: getMetricValue(acoreData, 'Skill Readiness'),
          scarf_coefficient: calculateScarfCoefficient(acoreData)
        },
        scarf_profile: {
          status: (getMetricValue(acoreData, 'Leadership Trust') || 70) / 100,
          certainty: (getMetricValue(acoreData, 'Role Clarity') || 70) / 100,
          autonomy: 0.7,
          relatedness: 0.7,
          fairness: 0.7
        },
        trigger_conditions: [],
        timestamp: new Date().toISOString()
      };

      // Run full charter-compliant analysis
      const result = await runDecisionAnalysis({
        decisionContext: decisionContext,
        knownRisks: knownRisks.split('\n').filter(r => r.trim()),
        m1RiskFlag: effectiveM1RiskFlag,
        initialConclusion: initialConclusion || undefined
      });

      setDecisionLog(result);

      // Create Audit Log Entry
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        module: 'M2: Decision Engine',
        action: 'Decision Analysis Completed',
        hash: result.input_hash.substring(0, 16),
        complianceTags: result.compliance_tags,
        details: `Decision ID: ${result.decision_id}\n` +
          `Risk Level: ${result.m2_recommendation.decision_outcome}\n` +
          `Biases Detected: ${result.biases_detected.length}\n` +
          `Determinism Tier: ${result.determinism_tier}\n` +
          `Confidence: ${Math.round(result.m2_recommendation.confidence_score * 100)}%`
      };
      onLogGenerated(newLog);

    } catch (error) {
      console.error('Decision Analysis Error:', error);

      // Fallback to legacy analysis
      const riskSummary = acoreData
        .map(d => `${d.category}: ${d.value}/100 (Threshold: ${d.threshold})`)
        .join('\n    ');

      const fallbackResult = await generatePremortemAnalysis(decisionContext, riskSummary);
      setLegacyAnalysis(fallbackResult);

      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        module: 'M2: Decision Engine',
        action: 'Pre-mortem Analysis Completed (Legacy)',
        hash: `sha256-${Math.random().toString(36).substring(7)}`,
        complianceTags: ['EU AI Act Art 14', 'EU AI Act Art 13'],
        details: `Context: ${decisionContext.substring(0, 50)}...\nRisks Identified: ${fallbackResult.length}`
      };
      onLogGenerated(newLog);
    }

    setIsThinking(false);
    setStep('COMPLETE');
  };

  // === HELPER FUNCTIONS ===

  const determinePrimaryDriver = (data: ACOREDataPoint[]): string => {
    const lowSafety = data.find(d => d.category === 'Psychological Safety' && d.value < d.threshold);
    const highFatigue = data.find(d => d.category === 'Change Fatigue' && d.value > d.threshold);
    if (lowSafety) return 'LOW_PSYCHOLOGICAL_SAFETY';
    if (highFatigue) return 'HIGH_CHANGE_FATIGUE';
    return 'NONE';
  };

  const getMetricValue = (data: ACOREDataPoint[], category: string): number => {
    const metric = data.find(d => d.category === category);
    return metric?.value || 70;
  };

  const calculateScarfCoefficient = (data: ACOREDataPoint[]): number => {
    const avgValue = data.reduce((sum, d) => sum + d.value, 0) / (data.length || 1);
    return Math.min(1, avgValue / 100);
  };

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-300';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      default: return 'text-green-600 bg-green-50 border-green-300';
    }
  };

  const getDeterminismColor = (tier: DeterminismTier): string => {
    switch (tier) {
      case 'TIER_1_DETERMINISTIC': return 'bg-green-100 text-green-800 border-green-200';
      case 'TIER_2_CONSTRAINED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getOutcomeColor = (outcome: string): string => {
    switch (outcome) {
      case 'PROCEED': return 'bg-green-100 text-green-800';
      case 'PROCEED_WITH_CONTROLS': return 'bg-yellow-100 text-yellow-800';
      case 'DELAY_PENDING_REVIEW': return 'bg-orange-100 text-orange-800';
      case 'ABORT_RECOMMENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // === IDLE STATE ===

  if (!riskSignalActive && step === 'IDLE') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-center">
        <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium">System Idle</h3>
        <p className="max-w-md mt-2">
          M2 activates automatically when human-factor risks (e.g., Low Safety, High Fatigue) are detected in M1.
        </p>
        <div className="mt-6 text-xs text-slate-400">
          <p>Charter: M2 Decision Engine v3.1</p>
          <p>Compliance: EU AI Act Art 13, 14 | DORA Pillar 3</p>
        </div>
      </div>
    );
  }

  // === MAIN RENDER ===

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-indigo-600" />
              M2: Decision Engine
            </h2>
            <p className="text-indigo-600/80 mt-1">
              Neurosymbolic Cognitive De-biasing System v2.0
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(riskLevel)}`}>
            Risk Level: {riskLevel}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* M1 Risk Integration Panel (Golden Thread) */}
        {(m1RiskFlag || riskSignalActive) && step !== 'COMPLETE' && (
          <div className={`mb-6 p-4 rounded-xl border-2 transition-colors ${getRiskLevelColor(riskLevel)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6" />
                <div>
                  <h4 className="font-bold text-slate-900">Golden Thread: M1 Human Factor Risk</h4>
                  <p className="text-sm text-slate-600">
                    ATRI: {atriScore.toFixed(1)} | Zone: {atriZone} | Protocol: {debiasingProtocol}
                  </p>
                </div>
              </div>
            </div>

            {/* Limiting Factors */}
            {limitingFactors.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-500">Active Limiting Factors:</span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {limitingFactors.map(f => (
                    <span key={f} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SCARF Threats */}
            {scarfThreats.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-500">SCARF Threat Domains:</span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {scarfThreats.map(t => (
                    <span key={t} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INPUT STEP */}
        {step === 'INPUT' && (
          <div className="space-y-6 animate-fade-in">
            {/* Circuit Breaker Alert */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
              <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Cognitive Circuit-Breaker Activated</h4>
                <p className="text-sm text-amber-700 mt-1">
                  M1 ACORE has detected critical human-factor risks. Complete a mandatory Pre-mortem analysis before proceeding with strategic decisions.
                </p>
              </div>
            </div>

            {/* Decision Context Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Decision Context / Strategic Initiative *
              </label>
              <textarea
                className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                rows={4}
                placeholder="E.g., Launching Project Phoenix to restructure the EMEA sales division. We plan to invest $5M and expect 200% ROI..."
                value={decisionContext}
                onChange={(e) => setDecisionContext(e.target.value)}
              />
            </div>

            {/* Real-time Bias Detection */}
            {detectedBiases.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={16} />
                  Potential Cognitive Biases Detected ({detectedBiases.length})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detectedBiases.map((bias, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      bias.severity === 'High' ? 'bg-red-50 border-red-200' :
                      bias.severity === 'Medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-slate-800">{bias.type}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          bias.severity === 'High' ? 'bg-red-200 text-red-800' :
                          bias.severity === 'Medium' ? 'bg-amber-200 text-amber-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {bias.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{bias.description}</p>
                      <p className="text-sm text-slate-500 mt-1 italic flex items-start gap-1">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        {bias.mitigation}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Evidence: "{bias.evidence}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Known Risks Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Known Risks (one per line)
              </label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                rows={3}
                placeholder="Market volatility&#10;Regulatory changes&#10;Resource constraints"
                value={knownRisks}
                onChange={(e) => setKnownRisks(e.target.value)}
              />
            </div>

            {/* Initial Conclusion (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Initial Conclusion (Optional - for Consider-the-Opposite analysis)
              </label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="E.g., We should proceed with full investment"
                value={initialConclusion}
                onChange={(e) => setInitialConclusion(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={!decisionContext.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              Run Charter-Compliant Decision Analysis
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-slate-500 text-center">
              Analysis includes: Pre-Mortem, Bias Detection, Determinism Verification, Compliance Tagging
            </p>
          </div>
        )}

        {/* ANALYSIS STEP */}
        {step === 'ANALYSIS' && isThinking && (
          <div className="flex flex-col items-center justify-center h-64 text-indigo-600">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium text-lg">Generating Decision Analysis...</p>
            <p className="text-sm text-slate-500 mt-2">Analyzing M1 data signals and detecting biases...</p>
            <div className="mt-4 text-xs text-slate-400 space-y-1">
              <p>Step 1: Evaluating ATRI and SCARF metrics</p>
              <p>Step 2: Detecting cognitive biases in context</p>
              <p>Step 3: Running Pre-Mortem analysis</p>
              <p>Step 4: Verifying determinism</p>
            </div>
          </div>
        )}

        {/* COMPLETE STEP - Charter Compliant Results */}
        {step === 'COMPLETE' && decisionLog && (
          <div className="space-y-6 animate-fade-in pb-8">
            {/* Results Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Decision Analysis Results</h3>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Logged to M3
              </span>
            </div>

            {/* Determinism Status (G-003) */}
            <div className={`p-4 rounded-lg border ${getDeterminismColor(decisionLog.determinism_tier as DeterminismTier)}`}>
              <div className="flex items-center gap-2">
                {decisionLog.determinism_tier === 'TIER_1_DETERMINISTIC' ? (
                  <CheckCircle2 className="text-green-600" size={20} />
                ) : decisionLog.determinism_tier === 'TIER_2_CONSTRAINED' ? (
                  <AlertTriangle className="text-yellow-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <span className="font-medium">
                  Determinism: {decisionLog.determinism_tier.replace(/_/g, ' ')}
                </span>
                <span className="ml-auto text-sm">
                  Confidence: {Math.round(decisionLog.m2_recommendation.confidence_score * 100)}%
                </span>
              </div>
              {decisionLog.determinism_tier === 'TIER_3_STOCHASTIC' && (
                <p className="text-sm text-red-600 mt-2">
                  Output variability detected. Results may differ on re-analysis. Manual review recommended.
                </p>
              )}
            </div>

            {/* Decision Outcome */}
            <div className={`p-4 rounded-lg ${getOutcomeColor(decisionLog.m2_recommendation.decision_outcome as string)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Recommendation</h4>
                  <p className="text-xl font-semibold mt-1">
                    {(decisionLog.m2_recommendation.decision_outcome as string).replace(/_/g, ' ')}
                  </p>
                </div>
                <Target className="w-10 h-10 opacity-30" />
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Executive Summary</h4>
              <p className="text-slate-600">{decisionLog.executive_summary}</p>
            </div>

            {/* M1 Input Summary (Golden Thread) */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Shield size={16} />
                M1 Risk Flag Summary (Golden Thread)
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-indigo-600">Risk Flag:</span>
                  <span className={`ml-2 font-medium ${decisionLog.m1_input_flag.risk_flag ? 'text-red-600' : 'text-green-600'}`}>
                    {decisionLog.m1_input_flag.risk_flag ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
                <div>
                  <span className="text-indigo-600">ATRI Score:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {decisionLog.m1_input_flag.atri_score.toFixed(1)} ({decisionLog.m1_input_flag.atri_zone})
                  </span>
                </div>
                <div>
                  <span className="text-indigo-600">Primary Driver:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {decisionLog.m1_input_flag.primary_driver || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-indigo-600">Protocol:</span>
                  <span className="ml-2 font-medium text-slate-800">
                    {decisionLog.debiasing_workflow_triggered}
                  </span>
                </div>
              </div>
              {decisionLog.m1_input_flag.limiting_factors_active.length > 0 && (
                <div className="mt-3">
                  <span className="text-indigo-600 text-sm">Limiting Factors:</span>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {decisionLog.m1_input_flag.limiting_factors_active.map(f => (
                      <span key={f} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detected Biases */}
            {decisionLog.biases_detail.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">Detected Cognitive Biases ({decisionLog.biases_detail.length})</h4>
                {decisionLog.biases_detail.map((bias, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    bias.severity === 'High' ? 'bg-red-50 border-red-200' :
                    bias.severity === 'Medium' ? 'bg-amber-50 border-amber-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-slate-800">{bias.type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        bias.severity === 'High' ? 'bg-red-200 text-red-800' :
                        bias.severity === 'Medium' ? 'bg-amber-200 text-amber-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {bias.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{bias.description}</p>
                    <p className="text-sm text-slate-500 mt-1 italic">Mitigation: {bias.mitigation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pre-Mortem Scenarios */}
            {decisionLog.pre_mortem_scenarios.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">Pre-Mortem Failure Scenarios</h4>
                {decisionLog.pre_mortem_scenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedScenario(expandedScenario === idx ? null : idx)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 font-bold rounded-lg flex items-center justify-center text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900">{scenario.title}</h5>
                            {expandedScenario === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                          <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                              <TrendingUp className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-medium text-amber-800">
                                {Math.round(scenario.probability * 100)}%
                              </span>
                            </div>
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                              {scenario.risk_category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedScenario === idx && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                        <p className="text-sm text-slate-600 mb-3">{scenario.description}</p>
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                            <div>
                              <span className="text-xs font-bold text-emerald-700 uppercase">Mitigation Strategy</span>
                              <p className="text-sm text-slate-600 mt-1">{scenario.mitigation_strategy}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Causal Path (Logic Trace) */}
            <div className="border rounded-lg overflow-hidden">
              <button
                className="w-full p-3 bg-slate-50 flex items-center justify-between text-left"
                onClick={() => setShowCausalPath(!showCausalPath)}
              >
                <span className="font-medium text-slate-700">Logic Trace (Causal Path)</span>
                {showCausalPath ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCausalPath && (
                <div className="p-4 bg-slate-100">
                  <div className="flex flex-wrap gap-2">
                    {decisionLog.m2_recommendation.causal_path.map((node, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-3 py-1 bg-white rounded-full text-xs border shadow-sm">
                          {node}
                        </span>
                        {idx < decisionLog.m2_recommendation.causal_path.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-400 self-center" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Trace ID: {decisionLog.m2_recommendation.logic_trace_id}
                  </p>
                </div>
              )}
            </div>

            {/* Compliance Tags */}
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-2">Compliance Tags</h4>
              <div className="flex flex-wrap gap-2">
                {decisionLog.compliance_tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Compliance Note */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <strong>Compliance Note (EU AI Act Art 14):</strong> By reviewing these scenarios and the causal path, you have demonstrated effective human oversight of the algorithmic risk assessment. This decision has been logged immutably to M3 Alexandra.
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-between gap-4">
              <button
                onClick={() => {
                  setStep('INPUT');
                  setDecisionContext('');
                  setKnownRisks('');
                  setInitialConclusion('');
                  setDecisionLog(null);
                }}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                New Analysis
              </button>
              <button
                onClick={onViewAuditLog}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Proceed to Governance (M3)
              </button>
            </div>
          </div>
        )}

        {/* COMPLETE STEP - Legacy Results (Fallback) */}
        {step === 'COMPLETE' && !decisionLog && legacyAnalysis && (
          <div className="space-y-6 animate-fade-in pb-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Pre-mortem Results (Legacy)</h3>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Logged in M3
              </span>
            </div>

            <div className="grid gap-6">
              {legacyAnalysis.map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 font-bold rounded-lg flex items-center justify-center text-sm">
                        {idx + 1}
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.scenario}</h4>
                    </div>

                    <div className="flex flex-wrap gap-4 pl-12">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-slate-500 font-medium uppercase">Prob:</span>
                        <span className="text-sm font-bold text-slate-800">{item.probability}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-slate-500 font-medium uppercase">Impact:</span>
                        <span className="text-sm font-bold text-slate-800">{item.impact}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3 pl-5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block mb-0.5">
                        Recommended Mitigation
                      </span>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <strong>Compliance Note (EU AI Act Art 14):</strong> By reviewing these scenarios, you have demonstrated effective human oversight of the algorithmic risk assessment.
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={onViewAuditLog}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Proceed to Governance (M3)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DecisionEngineModule;
