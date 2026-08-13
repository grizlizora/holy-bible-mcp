"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GlassBox } from './glass';

interface Props {
  children?: ReactNode;
  fallbackText?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error in Component Tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <GlassBox variant="medium" intensity="md" className="p-6 m-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-slate-800 dark:text-slate-100 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-red-600 dark:text-red-400">
                Виникла помилка під час рендерингу
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {this.props.fallbackText || 'Трапився неочікуваний збій у роботі компонента.'}
              </p>
            </div>
          </div>
          {this.state.error && (
            <pre className="p-3 bg-slate-900/80 text-red-300 font-mono text-xs rounded-xl overflow-x-auto mb-4 border border-slate-800">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Спробувати знову</span>
          </button>
        </GlassBox>
      );
    }

    return this.props.children;
  }
}
