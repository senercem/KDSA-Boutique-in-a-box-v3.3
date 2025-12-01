import React from 'react';
import { Activity, BrainCircuit, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  onChangeView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">KDSA Program v3.3</h1>
        <p className="text-slate-300 max-w-2xl">
          The "Golden Thread" architecture addressing the Corrected Triad of Decision Risk: 
          Human-Factor Failure, Cognitive Bias, and Algorithmic Governance.
        </p>
        
        <div className="mt-8 flex gap-4">
            <button onClick={() => onChangeView('m1')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Monitor Risks (M1)
            </button>
            <button onClick={() => onChangeView('m3')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-slate-600">
                View Audit Log (M3)
            </button>
        </div>
      </div>

      {/* Triad Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: M1 */}
        <div 
            onClick={() => onChangeView('m1')}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                    <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Action Req
                </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">M1: ACORE</h3>
            <p className="text-sm text-slate-500 mb-4">Human-Factor Sensing Layer</p>
            <div className="text-sm text-slate-600">
                <strong>Status:</strong> <span className="text-red-600 font-medium">High Risk Detected</span>
                <p className="text-xs mt-1">Change Fatigue metrics exceeding threshold.</p>
            </div>
        </div>

        {/* Card 2: M2 */}
        <div 
            onClick={() => onChangeView('m2')}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <BrainCircuit className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">M2: Decision Engine</h3>
            <p className="text-sm text-slate-500 mb-4">Cognitive De-biasing</p>
            <div className="text-sm text-slate-600">
                <strong>Status:</strong> <span className="text-amber-600 font-medium">Waiting for Input</span>
                <p className="text-xs mt-1">Circuit-breaker triggered by M1 signal.</p>
            </div>
        </div>

        {/* Card 3: M3 */}
        <div 
             onClick={() => onChangeView('m3')}
             className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-slate-700" />
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                    Active
                </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">M3: Alexandra</h3>
            <p className="text-sm text-slate-500 mb-4">AI Governance & Compliance</p>
            <div className="text-sm text-slate-600">
                <strong>Status:</strong> <span className="text-emerald-600 font-medium">Compliant</span>
                <p className="text-xs mt-1">Logging active. DORA CTPP Pack ready.</p>
            </div>
        </div>
      </div>

      {/* Golden Thread Visualization */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">The "Golden Thread" Workflow</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-200 -z-10 hidden md:block"></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center bg-white p-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-sm mb-3">
                    <span className="font-bold text-emerald-700">1</span>
                </div>
                <h4 className="font-semibold text-slate-800">Sense (M1)</h4>
                <p className="text-xs text-slate-500 max-w-[150px]">Detect hidden human-factor risks in real-time.</p>
            </div>

             {/* Arrow */}
             <ArrowRight className="w-6 h-6 text-slate-300 md:rotate-0 rotate-90" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center bg-white p-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-sm mb-3">
                    <span className="font-bold text-indigo-700">2</span>
                </div>
                <h4 className="font-semibold text-slate-800">Decide (M2)</h4>
                <p className="text-xs text-slate-500 max-w-[150px]">Intervene with System 2 analytic tools.</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-6 h-6 text-slate-300 md:rotate-0 rotate-90" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center bg-white p-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm mb-3">
                    <span className="font-bold text-slate-700">3</span>
                </div>
                <h4 className="font-semibold text-slate-800">Govern (M3)</h4>
                <p className="text-xs text-slate-500 max-w-[150px]">Log immutably for audit & compliance.</p>
            </div>
        </div>
      </div>
    </div>
  );
};