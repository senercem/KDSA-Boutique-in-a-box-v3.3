import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ACOREModule } from './components/ACOREModule';
import { DecisionEngineModule } from './components/DecisionEngineModule';
import { AlexandraModule } from './components/AlexandraModule';
import { EMPTY_ACORE_METRICS, INITIAL_LOGS, INITIAL_POLICIES } from './constants';
import { AuditLogEntry, ACOREDataPoint, GovernancePolicy } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [riskSignal, setRiskSignal] = useState(false);
  const [acoreData, setAcoreData] = useState<ACOREDataPoint[]>(EMPTY_ACORE_METRICS);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [policies, setPolicies] = useState<GovernancePolicy[]>(INITIAL_POLICIES);

  // Handler when M1 detects high risk based on user input
  const handleRiskDetected = (isHighRisk: boolean) => {
    setRiskSignal(isHighRisk);
  };

  // Handler for updating ACORE data from the M1 module
  const handleAcoreUpdate = (newData: ACOREDataPoint[]) => {
    setAcoreData(newData);
  };

  // Handler when M2 completes a decision log
  const handleLogGenerated = (newLog: AuditLogEntry) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleViewAuditLog = () => {
    setCurrentView('m3');
  };

  const handleAddPolicy = (newPolicy: GovernancePolicy) => {
    setPolicies(prev => [newPolicy, ...prev]);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onChangeView={setCurrentView} />;
      case 'm1':
        return (
          <ACOREModule 
            data={acoreData} 
            onDataChange={handleAcoreUpdate}
            onRiskDetected={handleRiskDetected} 
          />
        );
      case 'm2':
        return (
          <DecisionEngineModule 
            riskSignalActive={riskSignal} 
            acoreData={acoreData}
            onLogGenerated={handleLogGenerated}
            onViewAuditLog={handleViewAuditLog}
          />
        );
      case 'm3':
        return (
          <AlexandraModule 
            logs={logs} 
            acoreData={acoreData} 
            policies={policies}
            onAddPolicy={handleAddPolicy}
          />
        );
      default:
        return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
}