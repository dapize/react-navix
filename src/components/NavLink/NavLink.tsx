import { forwardRef, useContext } from "react";

import { resolvePath } from "@helpers/resolvePath";
import { RoutesContext } from "@contexts/RoutesContext";
import { useLocationSelector } from "@hooks/useLocationSelector";
import { Link } from "../Link";
import { isActive } from "./NavLink.helpers";
import type { NavLinkProps } from "./NavLink.types";

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
	({ to, replace, relative, children, activeClassName, activeStyle, exact, end, className, style, ...anchorProps }, ref) => {
		const { routeBase } = useContext(RoutesContext);
		const resolvedExact = exact ?? end ?? false;

		const active = useLocationSelector((loc) => {
			const resolveBase = relative === "path" ? loc.pathname : routeBase || loc.pathname;
			const resolvedTo = resolvePath(to, resolveBase);
			return isActive(resolvedTo, loc.pathname, resolvedExact);
		});
		const mergedClassName = [className, active && activeClassName].filter(Boolean).join(" ") || undefined;
		const mergedStyle = active ? { ...style, ...activeStyle } : style;

		return (
			<Link ref={ref} to={to} replace={replace} relative={relative} className={mergedClassName} style={mergedStyle} {...anchorProps}>
				{children}
			</Link>
		);
	},
);
