import { useContext } from "react";

import { RouteErrorContext } from "@contexts/RouteErrorContext";

export const useRouteError = (): unknown => {
	const context = useContext(RouteErrorContext);

	if (context === null) {
		throw new Error("useRouteError() must be used within a route's errorElement.");
	}

	return context.error;
};
