"use client";

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    toast.error("Something went wrong. Our team has been notified.");
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-200">
          <div className="max-w-md w-full p-8 bg-surface-100 rounded-3xl border border-surface-300 shadow-xl text-center space-y-6">
            <div className="flex justify-center text-red-500">
              <AlertCircle size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Oops! Something went wrong</h2>
              <p className="text-gray-500">The page encountered an unexpected error. Please try refreshing or returning to the dashboard.</p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full p-3 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all"
            >
              <RefreshCcw size={18} /> Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
