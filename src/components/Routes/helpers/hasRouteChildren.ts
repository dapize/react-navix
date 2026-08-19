import { Children, type ReactNode } from "react";

export const hasRouteChildren = (routeChildren: ReactNode): boolean => {
	return routeChildren != null && Children.count(routeChildren) > 0;
};
