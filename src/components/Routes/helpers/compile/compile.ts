import { Children, isValidElement, type ReactNode } from "react";

import type { RouteProps } from "../../../Route";
import { parseSegments, type SegmentDescriptor } from "../segments";
import type { CompiledRoute, RouteBucket } from "./compile.types";

const STATIC_WEIGHT = 3;
const DYNAMIC_WEIGHT = 2;
const WILDCARD_WEIGHT = 0;

const calculateSpecificity = (segments: SegmentDescriptor[], isIndex: boolean): number => {
	if (isIndex || segments.length === 0) return 0;

	return segments.reduce((total, segment) => {
		if (segment.type === "static") return total + STATIC_WEIGHT;
		if (segment.type === "dynamic") return total + DYNAMIC_WEIGHT;
		return total + WILDCARD_WEIGHT;
	}, 0);
};

const getRouteIdentityKey = (routePath: string | undefined, isIndex: boolean): string => {
	if (isIndex) return "__index__";
	if (routePath === undefined || routePath === "") return "__layout__";
	return routePath.replace(/\/+$/, "");
};

const checkDuplicateRoute = (key: string, definitionOrder: number, seenPaths: Map<string, number>): void => {
	if (seenPaths.has(key)) {
		const firstOrder = seenPaths.get(key)!;
		const displayPath = key === "__index__" ? "<index>" : key === "__layout__" ? "<layout>" : key;
		console.warn(
			`Duplicate route "${displayPath}" detected. With scoring-based routing, the first defined instance (order #${firstOrder}) wins.`,
		);
		return;
	}
	seenPaths.set(key, definitionOrder);
};

const classifyRoute = (bucket: RouteBucket, route: CompiledRoute): void => {
	if (route.isAbsolute) {
		bucket.absolute.push(route);
		return;
	}

	if (route.isIndex || route.segments.length === 0) {
		bucket.empty.push(route);
		return;
	}

	const firstSegment = route.segments[0];

	if (firstSegment.type === "static") {
		const existing = bucket.static.get(firstSegment.value);
		if (existing) {
			existing.push(route);
		} else {
			bucket.static.set(firstSegment.value, [route]);
		}
		return;
	}

	if (firstSegment.type === "dynamic") {
		bucket.dynamic.push(route);
		return;
	}

	bucket.wildcard.push(route);
};

export const compileRoutes = (children: ReactNode): RouteBucket => {
	const bucket: RouteBucket = {
		static: new Map(),
		dynamic: [],
		wildcard: [],
		empty: [],
		absolute: [],
	};

	let definitionOrder = 0;
	const routeArray = Children.toArray(children);
	const seenPaths = new Map<string, number>();

	for (const child of routeArray) {
		if (!isValidElement(child)) continue;

		const props = child.props as RouteProps;
		const isIndex = props.index === true;
		const routePath = props.path;
		const isAbsolute = routePath?.startsWith("/") ?? false;

		const hasElement = props.element != null;
		const hasChildren = Children.count(props.children) > 0;

		if (!routePath && !isIndex && !hasElement && !hasChildren) {
			console.warn(
				"A <Route> without `path`, `index`, `element`, or `children` does nothing. Remove it or add at least one of these props.",
			);
		} else if (routePath && !hasElement && !hasChildren) {
			console.warn(`The <Route> with path "${routePath}" has no \`element\` and no \`children\`. It will render nothing.`);
		} else if (isIndex && !hasElement && !hasChildren) {
			console.warn("An index <Route> has no `element` and no `children`. It will render nothing.");
		}

		const routeKey = getRouteIdentityKey(routePath, isIndex);
		checkDuplicateRoute(routeKey, definitionOrder, seenPaths);

		const segments = isIndex ? [] : parseSegments(routePath ?? "");
		const specificity = calculateSpecificity(segments, isIndex);

		const compiled: CompiledRoute = {
			segments,
			specificity,
			definitionOrder: definitionOrder++,
			isIndex,
			isAbsolute,
			path: routePath ?? undefined,
			handle: props.handle ?? undefined,
			element: props.element ?? null,
			errorElement: props.errorElement ?? null,
			children: props.children ?? null,
		};

		classifyRoute(bucket, compiled);
	}

	return bucket;
};
