import React, { ReactNode } from 'react';
import { useGateway } from '../../hooks/useGateway';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../common/CommandPalette';
import { ToastContainer } from '../common/ToastContainer';
import { ErrorBoundary } from '../common/ErrorBoundary';

export interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const {
    currentRoute,
    setCurrentRoute,
    stats,
    pauseState,
    handleToggleEmergencyPause,
    handleResetDemo,
    isResetting,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    handleQuickRunScenario,
    pendingApprovalsCount,
    activeAlertsCount,
    toasts,
    removeToast
  } = useGateway();

  const handleNavigate = (route: typeof currentRoute) => {
    setCurrentRoute(route);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#08080A] text-[#E2E3E9] flex flex-col font-sans selection:bg-[#CC9166]/25 selection:text-white">
      {/* Top Navbar with Emergency Pause controls & Kill Switch */}
      <Navbar
        stats={stats}
        pauseState={pauseState}
        onToggleEmergencyPause={handleToggleEmergencyPause}
        onResetDemo={handleResetDemo}
        onRouteChange={handleNavigate}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isResetting={isResetting}
        onToggleMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileNavOpen}
      />

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRouteChange={handleNavigate}
        onQuickRunScenario={handleQuickRunScenario}
        onToggleEmergencyPause={handleToggleEmergencyPause}
        isPaused={pauseState?.isPaused || false}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <Sidebar
          currentRoute={currentRoute}
          onRouteChange={handleNavigate}
          pendingApprovalsCount={pendingApprovalsCount}
          activeAlertsCount={activeAlertsCount}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Dynamic Route View wrapped in Error Boundary */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 overflow-y-auto">
          <ErrorBoundary fallbackTitle="Security Workspace Error">
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default AppLayout;
