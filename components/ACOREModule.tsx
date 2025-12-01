import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle, Activity, Sliders, RefreshCcw, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { ACOREDataPoint } from '../types';
import { fetchExternalBenchmarks, ExternalBenchmarkResult } from '../services/geminiService';

interface ACOREModuleProps {
  data: ACOREDataPoint[];
  onDataChange: (newData: ACOREDataPoint[]) => void;
  onRiskDetected: (isHighRisk: boolean) => void;
}

export const ACOREModule: React.FC<ACOREModuleProps> = ({ data, onDataChange, onRiskDetected }) => {
  const [isEditing, setIsEditing] = useState(true);
  const [externalData, setExternalData] = useState<ExternalBenchmarkResult | null>(null);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  
  // Calculate critical risks
  // Risk Logic: 
  // 1. Psych Safety < Threshold (Low safety is bad)
  // 2. Change Fatigue > Threshold (High fatigue is bad)
  // 3. Other metrics < Threshold (Low clarity/trust/readiness is bad)
  const criticalRisks = data.filter(d => {
    if (d.category === 'Change Fatigue') {
        return d.value > d.threshold;
    }
    return d.value < d.threshold;
  });
  
  const isHighRisk = criticalRisks.length > 0;

  // Calculate Organization Resilience Score (Simple Average for MVP)
  // Note: Change Fatigue is inverted for the score (100 - value) because high fatigue reduces resilience
  const resilienceScore = Math.round(data.reduce((acc, curr) => {
    const val = curr.category === 'Change Fatigue' ? (100 - curr.value) : curr.value;
    return acc + val;
  }, 0) / data.length);

  const handleSliderChange = (index: number, newValue: number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], value: newValue };
    onDataChange(newData);
  };

  const runDiagnostic = () => {
    setIsEditing(false);
    onRiskDetected(isHighRisk);
    // Reset external data on new run
    setExternalData(null);
  };

  const resetDiagnostic = () => {
    setIsEditing(true);
    onRiskDetected(false); // Reset signal until re-calculated
    setExternalData(null);
  };

  const fetchExternalContext = async () => {
    setIsLoadingExternal(true);
    // Focus search on the critical risks if any, otherwise general top metrics
    const topics = criticalRisks.length > 0 
        ? criticalRisks.map(r => r.category) 
        : data.slice(0, 3).map(d => d.category);
    
    const result = await fetchExternalBenchmarks(topics);
    setExternalData(result);
    setIsLoadingExternal(false);
  };

  // Custom Tick Component for Radar Chart
  const CustomPolarAngleAxisTick = ({ payload, x, y, cx, cy, ...rest }: any) => {
    const metric = data.find(d => d.category === payload.value);
    
    let isCritical = false;
    if (metric) {
         if (metric.category === 'Change Fatigue') {
            isCritical = metric.value > metric.threshold;
        } else {
            isCritical = metric.value < metric.threshold;
        }
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={3}
          textAnchor={rest.textAnchor}
          fill={isCritical ? '#ef4444' : '#64748b'}
          fontSize={11}
          fontWeight={isCritical ? 700 : 500}
        >
          {payload.value}
        </text>
        {isCritical && (
             <text x={0} y={-12} textAnchor={rest.textAnchor} fontSize={12}>⚠️</text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            M1: ACORE Sensing Layer
          </h2>
          <p className="text-slate-500 mt-1">Human-Factor Risk Monitoring & Leading Indicators</p>
        </div>
        
        {!isEditing && (
             <div className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${isHighRisk ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isHighRisk ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {isHighRisk ? 'CRITICAL RISK DETECTED' : 'SYSTEM STABLE'}
            </div>
        )}
      </div>

      {isEditing ? (
        <div className="max-w-3xl mx-auto w-full py-4 animate-fade-in">
            <div className="mb-6 text-center">
                <h3 className="text-lg font-semibold text-slate-800">Run New Diagnostic</h3>
                <p className="text-slate-500 text-sm">Adjust the sliders below to reflect the current organizational sentiment.</p>
            </div>
            
            <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                {data.map((metric, index) => (
                    <div key={metric.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700">{metric.category}</label>
                            <span className="text-sm font-bold text-slate-900">{metric.value}/100</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={metric.value} 
                            onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <p className="text-xs text-slate-400">{metric.description}</p>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center">
                <button 
                    onClick={runDiagnostic}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
                >
                    <Activity className="w-5 h-5" />
                    Calculate Resilience Score
                </button>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in h-full">
            {/* Chart Section */}
            <div className="flex flex-col gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col flex-1 min-h-[300px]">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Psychosocial Risk Radar</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis 
                                dataKey="category" 
                                tick={(props) => <CustomPolarAngleAxisTick {...props} />} 
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                            <Radar
                                name="Current Score"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="#10b981"
                                fillOpacity={0.3}
                            />
                            <Radar
                                name="Safety Threshold"
                                dataKey="threshold"
                                stroke="#ef4444"
                                strokeDasharray="4 4"
                                fill="transparent"
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* External Data Section */}
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            External Risk Intelligence
                        </h3>
                        {!externalData && !isLoadingExternal && (
                            <button 
                                onClick={fetchExternalContext}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                            >
                                Scan External Environment
                            </button>
                        )}
                    </div>
                    
                    {isLoadingExternal && (
                        <div className="flex items-center justify-center py-6 text-blue-600">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-xs font-medium">Querying live industry benchmarks...</span>
                        </div>
                    )}

                    {externalData && (
                        <div className="animate-fade-in">
                            <p className="text-sm text-blue-800 leading-relaxed mb-3">
                                {externalData.summary}
                            </p>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-blue-600 uppercase">Sources</p>
                                {externalData.sources.slice(0, 2).map((source, i) => (
                                    <a 
                                        key={i} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 truncate"
                                    >
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        {source.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {!externalData && !isLoadingExternal && (
                        <p className="text-xs text-blue-400 italic">
                            Click to enrich internal metrics with real-time external data from Google Search.
                        </p>
                    )}
                </div>
            </div>

            {/* Metrics & Alerts */}
            <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-slate-900 rounded-xl text-white shadow-lg">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Org. Resilience Score</p>
                        <div className="text-4xl font-bold mt-1">{resilienceScore}/100</div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Detailed Risk Analysis</h3>
                <div className="space-y-3">
                    {data.map((metric) => {
                        // Re-apply logic for individual items
                        const isHighFatigue = metric.category === 'Change Fatigue' && metric.value > metric.threshold;
                        const isLowScore = metric.category !== 'Change Fatigue' && metric.value < metric.threshold;
                        const isCritical = isHighFatigue || isLowScore;
                        
                        return (
                            <div key={metric.category} className={`p-3 rounded-lg border ${isCritical ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-slate-800">{metric.category}</span>
                                <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-slate-600'}`}>{metric.value}/100</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                <div 
                                    className={`h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${metric.value}%` }}
                                ></div>
                            </div>
                            {isCritical && (
                                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Risk Threshold Breached
                                </p>
                            )}
                            </div>
                        )
                    })}
                </div>
                
                <button 
                    onClick={resetDiagnostic}
                    className="w-full py-2 mt-4 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Recalibrate Inputs
                </button>
            </div>
        </div>
      )}
    </div>
  );
};