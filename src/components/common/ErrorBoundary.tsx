import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global React Error Boundary to catch UI rendering exceptions gracefully
 * and prevent whole-application crashes into blank screens.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SENTRIX ErrorBoundary Caught Exception]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-[10px] bg-[#121317] border border-rose-500/30 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-serif text-white font-normal">
                {this.props.fallbackTitle || 'Interface Render Anomaly'}
              </h2>
              <p className="text-xs text-[#9194A1] leading-relaxed">
                An unexpected exception occurred while rendering this view. Your gateway security boundaries and backend enforcement remain safe and active.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-[6px] bg-[#040406] border border-[#1C1D22] text-left">
                <p className="text-[11px] font-mono text-rose-300 truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleResetState}
                className="px-4 py-2 rounded-[6px] bg-[#1C1D22] hover:bg-[#2E3038] text-xs font-semibold text-white transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-[6px] bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
