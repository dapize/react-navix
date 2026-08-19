import type { ReactNode } from "react";

import type { SegmentDescriptor } from "../segments";

export interface CompiledRoute {
	segments: SegmentDescriptor[];
	specificity: number;
	definitionOrder: number;
	isIndex: boolean;
	isAbsolute: boolean;
	path?: string;
	handle?: unknown;
	element: ReactNode;
	errorElement: ReactNode;
	children: ReactNode;
}

export interface RouteBucket {
	static: Map<string, CompiledRoute[]>;
	dynamic: CompiledRoute[];
	wildcard: CompiledRoute[];
	empty: CompiledRoute[];
	absolute: CompiledRoute[];
}
