import { useContext } from "react";

import { RouteErrorContext } from "@contexts/RouteErrorContext";

export const useResetErrorBoundary = (): (() => void) => {
	const context = useContext(RouteErrorContext);

	if (context === null) {
		throw new Error("useResetErrorBoundary() must be used within a route's errorElement.");
	}

	return context.resetErrorBoundary;
};
