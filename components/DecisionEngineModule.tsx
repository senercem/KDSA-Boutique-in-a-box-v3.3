import React, { useState, useEffect } from 'react';
import { BrainCircuit, Zap, Loader2, ArrowRight, FileCheck, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { generatePremortemAnalysis } from '../services/geminiService';
import { PremortemScenario, AuditLogEntry, ACOREDataPoint } from '../types';

interface DecisionEngineProps {
  riskSignalActive: boolean;
  acoreData: ACOREDataPoint[];
  onLogGenerated: (log: AuditLogEntry) => void;
  onViewAuditLog: () => void;
}

export const DecisionEngineModule: React.FC<DecisionEngineProps> = ({ riskSignalActive, acoreData, onLogGenerated, onViewAuditLog }) => {
  const [decisionContext, setDecisionContext] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [analysis, setAnalysis] = useState<PremortemScenario[] | null>(null);
  const [step, setStep] = useState<'IDLE' | 'INPUT' | 'ANALYSIS' | 'COMPLETE'>('IDLE');

  // Auto-trigger logic:
  // When M1 sends a High Risk signal (riskSignalActive=true), 
  // we automatically transition from IDLE to INPUT to force the user to engage.
  useEffect(() => {
    if (riskSignalActive && step === 'IDLE') {
      setStep('INPUT');
    }
  }, [riskSignalActive, step]);

  const handleRunAnalysis = async () => {
    if (!decisionContext) return;
    setIsThinking(true);
    setStep('ANALYSIS');

    // Construct dynamic risk summary from real M1 data
    const riskSummary = acoreData
        .map(d => `${d.category}: ${d.value}/100 (Threshold: ${d.threshold})`)
        .join('\n    ');

    const result = await generatePremortemAnalysis(decisionContext, riskSummary);

    setAnalysis(result);
    setIsThinking(false);
    setStep('COMPLETE');

    // Create Audit Log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      module: 'M2: Decision Engine',
      action: 'Pre-mortem Analysis Completed',
      hash: `sha256-${Math.random().toString(36).substring(7)}`,
      complianceTags: ['EU AI Act Art 14', 'EU AI Act Art 13'],
      details: `Context: ${decisionContext.substring(0, 50)}... \nRisks Identified: ${result.length}. \nInput Risks: ${riskSummary.replace(/\n/g, ', ')}`,
    };
    onLogGenerated(newLog);
  };

  if (!riskSignalActive && step === 'IDLE') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-center">
        <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium">System Idle</h3>
        <p className="max-w-md mt-2">M2 activates automatically when human-factor risks (e.g., Low Safety, High Fatigue) are detected in M1.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
        <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-600" />
          M2: Decision Engine
        </h2>
        <p className="text-indigo-600/80 mt-1">Cognitive De-biasing & "System 2" Intervention</p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {step === 'INPUT' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-amber-800">Cognitive Circuit-Breaker Activated</h4>
                    <p className="text-sm text-amber-700 mt-1">
                        M1 ACORE has detected critical human-factor risks. You must complete a mandatory Pre-mortem before proceeding with any strategic decisions.
                    </p>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Decision Context / Strategic Initiative
                </label>
                <textarea 
                    className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    rows={4}
                    placeholder="E.g., Launching Project Phoenix to restructure the EMEA sales division..."
                    value={decisionContext}
                    onChange={(e) => setDecisionContext(e.target.value)}
                />
             </div>

             <button 
                onClick={handleRunAnalysis}
                disabled={!decisionContext}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
             >
                Run Pre-mortem Analysis
                <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        )}

        {step === 'ANALYSIS' && isThinking && (
          <div className="flex flex-col items-center justify-center h-64 text-indigo-600">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium text-lg">Generating Failure Scenarios...</p>
            <p className="text-sm text-slate-500 mt-2">Analysing M1 data signals...</p>
          </div>
        )}

        {step === 'COMPLETE' && analysis && (
          <div className="space-y-6 animate-fade-in pb-8">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Pre-mortem Results</h3>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Logged in M3
                </span>
             </div>
             
             <div className="grid gap-6">
                {analysis.map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="p-5">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 font-bold rounded-lg flex items-center justify-center text-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.scenario}</h4>
                                </div>
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
                            <div className="mt-0.5">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block mb-0.5">Recommended Mitigation</span>
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