import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';
import { reportError } from '../utils/errorReporting';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  fallback?: ReactNode | ((props: { error: Error | null; resetError: () => void }) => ReactNode);
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error, {
      source: 'ErrorBoundary',
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  public resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError,
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}
