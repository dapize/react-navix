import type { ReactNode } from "react";

export interface RouteProps {
	path?: string;
	index?: boolean;
	element?: ReactNode;
	errorElement?: ReactNode;
	children?: ReactNode;
	handle?: unknown;
}
