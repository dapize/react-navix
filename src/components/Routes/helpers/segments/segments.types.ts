export type SegmentType = "static" | "dynamic" | "wildcard";

export interface SegmentDescriptor {
	type: SegmentType;
	value: string;
}

export interface SegmentMatchResult {
	params: Record<string, string>;
	consumedCount: number;
}
