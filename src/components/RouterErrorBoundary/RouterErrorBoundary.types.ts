import type { ReactNode } from "react";

export interface RouterErrorBoundaryState {
	error: unknown;
}

export interface RouterErrorBoundaryProps {
	errorElement: ReactNode;
	children?: ReactNode;
}
