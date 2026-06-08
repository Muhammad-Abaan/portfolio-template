import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 glass-card border-red-500/50 text-red-500 rounded-2xl bg-red-500/10">
          <h2 className="text-xl font-bold mb-4">Something went wrong.</h2>
          <pre className="text-sm whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="text-xs opacity-70 mt-4 whitespace-pre-wrap">{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
