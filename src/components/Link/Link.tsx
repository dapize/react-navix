import { forwardRef, type MouseEvent, useContext } from "react";

import { resolvePath } from "@helpers/resolvePath";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { RoutesContext } from "@contexts/RoutesContext";
import { useLocation } from "@hooks/useLocation";
import { useNavigate } from "@hooks/useNavigate";
import { shouldLetBrowserHandle } from "./Link.helpers";
import type { LinkProps } from "./Link.types";

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
	({ to, replace = false, relative = "route", state, children, onClick: userOnClick, ...anchorProps }, ref) => {
		const navigate = useNavigate();
		const location = useLocation();
		const prefix = useContext(LocationStoreContext)?.prefix ?? "";
		const { routeBase } = useContext(RoutesContext);

		const resolveBase = relative === "path" ? location.pathname : routeBase || location.pathname;
		const resolvedHref = resolvePath(to, resolveBase);

		const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
			userOnClick?.(event);
			if (event.defaultPrevented) return;
			if (shouldLetBrowserHandle(event)) return;
			event.preventDefault();
			navigate(to, { replace, relative, state });
		};

		return (
			<a ref={ref} href={prefix + resolvedHref} onClick={handleClick} {...anchorProps}>
				{children}
			</a>
		);
	},
);
