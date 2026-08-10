import { Component, type ErrorInfo, type ReactNode } from "react";
import { WorkerRecoveryPanel } from "./WorkerRecoveryPanel";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("application boundary", error, info.componentStack);
  }

  render() {
    if (this.state.error)
      return (
        <main>
          <WorkerRecoveryPanel
            message={this.state.error.message}
            onRecover={() => window.location.reload()}
          />
        </main>
      );
    return this.props.children;
  }
}
