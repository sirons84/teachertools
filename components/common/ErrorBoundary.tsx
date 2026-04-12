"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <p className="font-semibold">오류가 발생했습니다.</p>
            <p className="mt-1 text-red-500">{this.state.message}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
