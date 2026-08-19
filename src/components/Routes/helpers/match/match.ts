import { Children } from "react";

import type { CompiledRoute, RouteBucket } from "../compile";
import { buildConsumed, tryMatchSegments } from "../segments";
import type { MatchEntry } from "./match.types";

const isLeaf = (route: CompiledRoute): boolean => {
	return Children.count(route.children) === 0;
};

export const matchRoute = (pathname: string, bucket: RouteBucket, parentBasePath: string): MatchEntry | null => {
	const pathSegments = pathname.split("/").filter(Boolean);
	const parentSegments = parentBasePath.split("/").filter(Boolean);
	const candidates: MatchEntry[] = [];

	for (const route of bucket.absolute) {
		const result = tryMatchSegments(route.segments, pathSegments);
		if (result && (!isLeaf(route) || result.consumedCount === pathSegments.length)) {
			candidates.push({
				route,
				params: result.params,
				consumed: buildConsumed(pathSegments, result.consumedCount),
			});
		}
	}

	if (parentSegments.length > 0) {
		for (let i = 0; i < parentSegments.length; i++) {
			if (pathSegments[i] !== parentSegments[i]) {
				if (candidates.length === 0) return null;

				candidates.sort(
					(first, second) =>
						second.route.specificity - first.route.specificity || first.route.definitionOrder - second.route.definitionOrder,
				);

				return candidates[0];
			}
		}
	}

	const relativeSegments = pathSegments.slice(parentSegments.length);
	const parentConsumedCount = parentSegments.length;

	const addCandidate = (route: CompiledRoute, params: Record<string, string>, consumedCount: number) => {
		candidates.push({
			route,
			params,
			consumed: buildConsumed(pathSegments, parentConsumedCount + consumedCount),
		});
	};

	for (const route of bucket.empty) {
		if (route.isIndex && relativeSegments.length > 0) continue;
		if (isLeaf(route) && relativeSegments.length > 0) continue;
		addCandidate(route, {}, 0);
	}

	if (relativeSegments.length >= 1) {
		const firstSegment = relativeSegments[0];
		const staticRoutes = bucket.static.get(firstSegment);

		if (staticRoutes) {
			for (const route of staticRoutes) {
				const result = tryMatchSegments(route.segments, relativeSegments);
				if (result && (!isLeaf(route) || result.consumedCount === relativeSegments.length)) {
					addCandidate(route, result.params, result.consumedCount);
				}
			}
		}
	}

	for (const route of bucket.dynamic) {
		const result = tryMatchSegments(route.segments, relativeSegments);
		if (result && (!isLeaf(route) || result.consumedCount === relativeSegments.length)) {
			addCandidate(route, result.params, result.consumedCount);
		}
	}

	for (const route of bucket.wildcard) {
		const result = tryMatchSegments(route.segments, relativeSegments);
		if (result && (!isLeaf(route) || result.consumedCount === relativeSegments.length)) {
			addCandidate(route, result.params, result.consumedCount);
		}
	}

	if (candidates.length === 0) return null;

	candidates.sort(
		(first, second) => second.route.specificity - first.route.specificity || first.route.definitionOrder - second.route.definitionOrder,
	);

	return candidates[0];
};
