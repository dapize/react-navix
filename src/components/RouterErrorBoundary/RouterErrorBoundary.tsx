import { Component, createElement, type ErrorInfo, type ReactNode } from "react";

import { RouteErrorContext } from "@contexts/RouteErrorContext";
import type { RouterErrorBoundaryProps, RouterErrorBoundaryState } from "./RouterErrorBoundary.types";

export class RouterErrorBoundary extends Component<RouterErrorBoundaryProps, RouterErrorBoundaryState> {
	state: RouterErrorBoundaryState = { error: null };

	private consecutiveErrors = 0;

	private static readonly MAX_CONSECUTIVE_ERRORS = 3;

	static getDerivedStateFromError(error: unknown): Partial<RouterErrorBoundaryState> {
		return { error };
	}

	componentDidCatch(_error: unknown, _errorInfo: ErrorInfo) {
		this.consecutiveErrors++;
	}

	private readonly handleReset = () => {
		this.setState({ error: null });
	};

	render(): ReactNode {
		if (this.state.error !== null) {
			if (this.consecutiveErrors >= RouterErrorBoundary.MAX_CONSECUTIVE_ERRORS) {
				return null;
			}

			return createElement(
				RouteErrorContext.Provider,
				{
					value: {
						error: this.state.error,
						resetErrorBoundary: this.handleReset,
					},
				},
				this.props.errorElement,
			);
		}

		return this.props.children;
	}
}
