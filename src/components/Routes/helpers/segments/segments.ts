import type { SegmentDescriptor, SegmentMatchResult } from "./segments.types";

export const parseSegments = (path: string): SegmentDescriptor[] => {
	const rawSegments = path.split("/").filter(Boolean);

	return rawSegments.map((segment) => {
		if (segment === "*") {
			return { type: "wildcard" as const, value: "*" };
		}

		if (segment.startsWith(":")) {
			return { type: "dynamic" as const, value: segment.slice(1) };
		}

		return { type: "static" as const, value: segment };
	});
};

// Converts a consumedCount into the matching path string (e.g. "/users/123").
export const buildConsumed = (segments: string[], count: number): string => {
	return `/${segments.slice(0, count).join("/")}`;
};

export const tryMatchSegments = (patternSegments: SegmentDescriptor[], pathSegments: string[]): SegmentMatchResult | null => {
	const params: Record<string, string> = {};

	for (let segmentIndex = 0; segmentIndex < patternSegments.length; segmentIndex++) {
		const patternSegment = patternSegments[segmentIndex];
		const pathSegment = pathSegments[segmentIndex];

		if (patternSegment.type === "wildcard") {
			// A wildcard is only valid as the last segment.
			if (segmentIndex !== patternSegments.length - 1) return null;

			params["*"] = pathSegments.slice(segmentIndex).join("/");
			return { params, consumedCount: pathSegments.length };
		}

		if (pathSegment === undefined) return null;

		if (patternSegment.type === "static") {
			if (patternSegment.value !== pathSegment) return null;
		} else {
			params[patternSegment.value] = pathSegment;
		}
	}

	return { params, consumedCount: patternSegments.length };
};
