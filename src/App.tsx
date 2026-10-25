import React from 'react';
import { GatewayProvider, useGateway } from './context/GatewayContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { AttackDemo } from './pages/AttackDemo';
import { Playground } from './pages/Playground';
import { Policies } from './pages/Policies';
import { Approvals } from './pages/Approvals';
import { Alerts } from './pages/Alerts';
import { Audit } from './pages/Audit';
import { Settings } from './pages/Settings';

/**
 * AppContent routes views declaratively inside the shared AppLayout shell.
 */
function AppContent() {
  const {
    currentRoute,
    setCurrentRoute,
    stats,
    policies,
    conflicts,
    approvals,
    alerts,
    pauseState,
    auditEvents,
    isEvaluating,
    isLoading,
    isResetting,
    activePlaygroundPayload,
    refreshAllData,
    handleEvaluate,
    handleDecision,
    handleSimulateExpiry,
    handleTogglePolicy,
    handleQuickRunScenario,
    handleResolveAlert,
    handleGenerateSampleApproval,
    handleGenerateSampleAlert,
    handleTestPolicy,
    handleResetDemo
  } = useGateway();

  return (
    <AppLayout>
      {currentRoute === 'attack-demo' && (
        <AttackDemo
          onRouteChange={setCurrentRoute}
          onRefreshData={refreshAllData}
        />
      )}

      {currentRoute === 'dashboard' && (
        <Dashboard
          stats={stats}
          recentEvents={auditEvents}
          onRouteChange={setCurrentRoute}
          onQuickRunScenario={handleQuickRunScenario}
          isEvaluating={isEvaluating}
          onRefreshData={refreshAllData}
        />
      )}

      {currentRoute === 'playground' && (
        <Playground
          onEvaluate={handleEvaluate}
          onRouteChange={setCurrentRoute}
          isEvaluating={isEvaluating}
          initialPayload={activePlaygroundPayload}
        />
      )}

      {currentRoute === 'policies' && (
        <Policies
          policies={policies}
          conflicts={conflicts}
          onTogglePolicy={handleTogglePolicy}
          onTestPolicy={handleTestPolicy}
          onRefreshPolicies={refreshAllData}
          isLoading={isLoading}
        />
      )}

      {currentRoute === 'approvals' && (
        <Approvals
          approvals={approvals}
          onDecision={handleDecision}
          onSimulateExpiry={handleSimulateExpiry}
          onRouteChange={setCurrentRoute}
          onGenerateSampleApproval={handleGenerateSampleApproval}
          isLoading={isLoading}
          emergencyPaused={pauseState?.isPaused || false}
        />
      )}

      {currentRoute === 'alerts' && (
        <Alerts
          alerts={alerts}
          onResolveAlert={handleResolveAlert}
          onRouteChange={setCurrentRoute}
          onGenerateSampleAlert={handleGenerateSampleAlert}
          isLoading={isLoading}
        />
      )}

      {currentRoute === 'audit' && (
        <Audit
          events={auditEvents}
          isLoading={isLoading}
          onRefreshAudit={refreshAllData}
        />
      )}

      {currentRoute === 'settings' && (
        <Settings
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />
      )}
    </AppLayout>
  );
}

/**
 * Root Application Component wrapped in the global Gateway state provider.
 */
export function App() {
  return (
    <GatewayProvider>
      <AppContent />
    </GatewayProvider>
  );
}

export default App;
