import { createElement, type ReactNode, useContext, useMemo, useRef } from "react";

import { MatchesContext, type MatchRecord } from "@contexts/MatchesContext";
import { ParamsContext } from "@contexts/ParamsContext";
import { OutletContext, RoutesContext } from "@contexts/RoutesContext";
import { useLocation } from "@hooks/useLocation";
import { RouterErrorBoundary } from "../RouterErrorBoundary";
import { areParamsEqual } from "./helpers/areParamsEqual";
import { compileRoutes } from "./helpers/compile";
import { getRouteResolutionBase } from "./helpers/getRouteResolutionBase";
import { hasRouteChildren } from "./helpers/hasRouteChildren";
import { matchRoute } from "./helpers/match";
import type { RoutesProps } from "./Routes.types";

const buildOutlet = (routeChildren: ReactNode, routeBase: string, params: Record<string, string>): ReactNode => {
	if (!hasRouteChildren(routeChildren)) return null;

	return createElement(RoutesContext.Provider, { value: { params, routeBase } }, createElement(Routes, null, routeChildren));
};

export const Routes = ({ children }: RoutesProps) => {
	const location = useLocation();
	const { routeBase: parentBasePath, params: parentParams } = useContext(RoutesContext);
	const parentMatches = useContext(MatchesContext);

	const prevMergedParams = useRef<Record<string, string>>({});
	const prevMatches = useRef<MatchRecord[]>([]);

	const bucket = useMemo(() => compileRoutes(children), [children]);

	const matchEntry = matchRoute(location.pathname, bucket, parentBasePath);

	if (!matchEntry) return null;

	const { route: matchedRoute, params: rawParams, consumed: rawConsumed } = matchEntry;

	const ownRouteBase = getRouteResolutionBase(rawConsumed, rawParams);

	const nextParams = { ...parentParams, ...rawParams };
	const previousParams = prevMergedParams.current;
	const sameValues = areParamsEqual(nextParams, previousParams);
	const mergedParams = sameValues ? previousParams : nextParams;
	if (!sameValues) prevMergedParams.current = nextParams;

	const currentRecord: MatchRecord = {
		pathname: rawConsumed,
		params: rawParams,
		path: matchedRoute.path,
		handle: matchedRoute.handle,
	};

	const candidateMatches = [...parentMatches, currentRecord];
	let matches: MatchRecord[];

	const prev = prevMatches.current;
	if (prev.length === candidateMatches.length) {
		let identical = true;
		for (let i = 0; i < candidateMatches.length; i++) {
			const c = candidateMatches[i];
			const p = prev[i];
			if (c.pathname !== p.pathname || c.path !== p.path || c.handle !== p.handle || !areParamsEqual(c.params, p.params)) {
				identical = false;
				break;
			}
		}
		matches = identical ? prev : candidateMatches;
	} else {
		matches = candidateMatches;
	}

	if (matches !== prev) {
		prevMatches.current = matches;
	}

	const outlet = buildOutlet(matchedRoute.children, ownRouteBase, mergedParams);

	const matchedElement = matchedRoute.element;
	const matchedErrorElement = matchedRoute.errorElement;

	let innerContent: ReactNode;

	if (!matchedElement) {
		if (!outlet) return null;

		innerContent = matchedErrorElement
			? createElement(RouterErrorBoundary, { key: location.key, errorElement: matchedErrorElement }, outlet)
			: outlet;
	} else {
		innerContent = matchedErrorElement
			? createElement(RouterErrorBoundary, { key: location.key, errorElement: matchedErrorElement }, matchedElement)
			: matchedElement;
		innerContent = createElement(OutletContext.Provider, { value: outlet }, innerContent);
	}

	return createElement(
		MatchesContext.Provider,
		{ value: matches },
		createElement(
			RoutesContext.Provider,
			{ value: { params: mergedParams, routeBase: ownRouteBase } },
			createElement(ParamsContext.Provider, { value: mergedParams }, innerContent),
		),
	);
};
