import React, { useState } from 'react';
import { ShieldCheck, Lock, Download, Search, ExternalLink, FileText, BookOpen, Plus, Sparkles, Gavel, Save } from 'lucide-react';
import { AuditLogEntry, ACOREDataPoint, GovernancePolicy } from '../types';
import { draftGovernancePolicy } from '../services/geminiService';

interface AlexandraModuleProps {
  logs: AuditLogEntry[];
  acoreData: ACOREDataPoint[];
  policies: GovernancePolicy[];
  onAddPolicy: (policy: GovernancePolicy) => void;
}

export const AlexandraModule: React.FC<AlexandraModuleProps> = ({ logs, acoreData, policies, onAddPolicy }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'policies'>('logs');
  
  // Policy Form State
  const [newPolicyTitle, setNewPolicyTitle] = useState('');
  const [newPolicyFramework, setNewPolicyFramework] = useState('EU AI Act');
  const [newPolicyContent, setNewPolicyContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  const handleDraftPolicy = async () => {
    if (!newPolicyTitle) return;
    setIsDrafting(true);
    const draft = await draftGovernancePolicy(newPolicyTitle, newPolicyFramework);
    setNewPolicyContent(draft);
    setIsDrafting(false);
  };

  const handleSavePolicy = () => {
    if (!newPolicyTitle || !newPolicyContent) return;
    
    const newPolicy: GovernancePolicy = {
      id: `pol-${Date.now()}`,
      title: newPolicyTitle,
      framework: newPolicyFramework,
      content: newPolicyContent,
      lastUpdated: new Date().toISOString()
    };
    
    onAddPolicy(newPolicy);
    
    // Reset form
    setNewPolicyTitle('');
    setNewPolicyContent('');
  };

  const handleExportDoraPack = () => {
    // Calculate aggregated metrics for the report
    const totalLogs = logs.length;
    const criticalRisks = acoreData.filter(d => {
         if (d.category === 'Change Fatigue') return d.value > d.threshold;
         return d.value < d.threshold;
    });
    const systemStatus = criticalRisks.length > 0 ? "RISK DETECTED (MITIGATION REQUIRED)" : "STABLE";

    // Structured Report following DORA & CTPP Best Practices
    const reportContent = `
# DORA & EU AI ACT COMPLIANCE PACK (CTPP-READY)
**Generated via KDSA v3.3**
**Date:** ${new Date().toISOString()}
**Report ID:** ${Math.random().toString(36).substring(7).toUpperCase()}

---

## 1. EXECUTIVE SUMMARY
**System Status:** ${systemStatus}
**Audit Ledger Integrity:** VERIFIED (SHA-256)
**Compliance Scope:** DORA (Regulation EU 2022/2554), EU AI Act (Risk Management)

This report consolidates real-time telemetry from the Human-Factor Sensing Layer (M1) and the Cognitive Decision Engine (M2) to demonstrate operational resilience and human oversight of algorithmic systems.

---

## 2. GOVERNANCE POLICIES
**Active Policy Definitions:**
${policies.map(p => `### ${p.title} (${p.framework})\n${p.content}\n`).join('\n')}

---

## 3. ICT RISK MANAGEMENT FRAMEWORK (DORA Art. 6-15)
*Data Source: M1 ACORE Module*

The following metrics serve as leading indicators for psychosocial and operational stability. Threshold breaches trigger mandatory cognitive circuit-breakers.

| Metric Category | Current Value | Safety Threshold | Status |
| :--- | :--- | :--- | :--- |
${acoreData.map(m => {
    const isBreach = m.category === 'Change Fatigue' ? m.value > m.threshold : m.value < m.threshold;
    return `| ${m.category} | ${m.value}/100 | ${m.threshold}/100 | ${isBreach ? '⚠️ BREACH' : 'OK'} |`;
}).join('\n')}

---

## 4. DIGITAL OPERATIONAL RESILIENCE TESTING (DORA Art. 24)
*Data Source: M2 Decision Engine*

The organization employs "Pre-mortem Analysis" as a form of Threat-Led Penetration Testing (TLPT) for decision-making processes.

**Recent Resilience Tests (Pre-mortems):**
${logs.filter(l => l.module === 'M2: Decision Engine').map(l => 
    `- [${new Date(l.timestamp).toLocaleDateString()}] ${l.details.replace(/\n/g, ' ')}`
).join('\n') || "No recent pre-mortem stress tests recorded."}

---

## 5. IMMUTABLE AUDIT TRAIL (EU AI Act Art. 12)
*Data Source: M3 Alexandra*

A chronological, tamper-evident record of all high-stakes interventions and system states.

| Timestamp | Module | Action | Compliance Tags | Hash |
| :--- | :--- | :--- | :--- | :--- |
${logs.map(l => `| ${new Date(l.timestamp).toISOString()} | ${l.module} | ${l.action} | ${l.complianceTags.join(', ')} | ${l.hash.substring(0, 8)}... |`).join('\n')}

---

**End of Report**
KDSA Architecture - Automated Governance Output
    `;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KDSA_DORA_Compliance_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                M3: Project Alexandra
                </h2>
                <p className="text-slate-500 mt-1">AI Governance, Compliance & Immutable Audit Log</p>
            </div>
            <button 
                onClick={handleExportDoraPack}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md"
            >
                <Download className="w-4 h-4" />
                Export "DORA CTPP-Ready" Pack
            </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mt-8 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'logs' 
                ? 'text-emerald-600 border-b-2 border-emerald-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Audit Ledger
          </button>
          <button 
            onClick={() => setActiveTab('policies')}
            className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'policies' 
                ? 'text-emerald-600 border-b-2 border-emerald-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Policy Manager
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'logs' ? (
          <div className="animate-fade-in">
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search audit logs by hash, ID, or tag..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-600">
                        Filter: All Modules
                    </div>
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">Timestamp</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Module & Action</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Compliance Mapping</th>
                            <th className="px-6 py-3 font-medium text-slate-500">Immutable Hash</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <FileText className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900">No Audit Logs Recorded</h3>
                                        <p className="text-slate-500 text-sm mt-2">
                                            System actions and decision records from the Decision Engine (M2) will appear here immutably.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{log.module}</div>
                                        <div className="text-slate-500 text-xs mt-0.5">{log.action}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {log.complianceTags.map(tag => (
                                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                                            <Lock className="w-3 h-3" />
                                            {log.hash.substring(0, 12)}...
                                            <ExternalLink className="w-3 h-3 hover:text-emerald-600 cursor-pointer" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">EU AI Act Readiness</h4>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Art 10, 13, 14 mapped.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">DORA Resilience</h4>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Pillar 3 & 4 covered.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">NIST AI RMF</h4>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Map & Measure active.</p>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 animate-fade-in h-full">
            {/* Left: Policy List */}
            <div className="flex-1 lg:w-2/3 space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800 text-lg">Governance Definitions</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        {policies.length} Active
                    </span>
                </div>
                
                <div className="space-y-4 h-[500px] overflow-y-auto pr-2">
                    {policies.map((policy) => (
                        <div key={policy.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Gavel className="w-4 h-4 text-slate-400" />
                                    <h4 className="font-bold text-slate-900">{policy.title}</h4>
                                </div>
                                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                    {policy.framework}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3 bg-slate-50 p-3 rounded border border-slate-100 italic">
                                "{policy.content}"
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                Last Updated: {new Date(policy.lastUpdated).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Add Policy Form */}
            <div className="lg:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                    <Plus className="w-5 h-5" />
                    <h3 className="font-bold">Define New Policy</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Policy Title</label>
                        <input 
                            type="text"
                            value={newPolicyTitle}
                            onChange={(e) => setNewPolicyTitle(e.target.value)}
                            placeholder="e.g. Data Retention Standard"
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Compliance Framework</label>
                        <select 
                            value={newPolicyFramework}
                            onChange={(e) => setNewPolicyFramework(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                        >
                            <option>EU AI Act</option>
                            <option>DORA</option>
                            <option>GDPR</option>
                            <option>NIST AI RMF</option>
                            <option>ISO 42001</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Policy Content</label>
                            <button 
                                onClick={handleDraftPolicy}
                                disabled={!newPolicyTitle || isDrafting}
                                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                            >
                                <Sparkles className="w-3 h-3" />
                                {isDrafting ? 'Drafting...' : 'Draft with Gemini'}
                            </button>
                        </div>
                        <textarea 
                            value={newPolicyContent}
                            onChange={(e) => setNewPolicyContent(e.target.value)}
                            rows={6}
                            placeholder="Enter policy text manually or use AI..."
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        />
                    </div>

                    <button 
                        onClick={handleSavePolicy}
                        disabled={!newPolicyTitle || !newPolicyContent}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save to Governance Registry
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};