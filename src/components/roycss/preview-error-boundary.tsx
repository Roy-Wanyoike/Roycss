"use client";
import React from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  effectName?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class PreviewErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log but don't crash the app
    console.warn(
      `Preview error for ${this.props.effectName ?? "unknown"}:`,
      error.message,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <AlertCircle className="size-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Preview unavailable for{" "}
            {this.props.effectName ?? "this effect"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-primary hover:text-primary/80 cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
