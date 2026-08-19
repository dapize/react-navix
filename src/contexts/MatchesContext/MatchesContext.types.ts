export interface MatchRecord {
	pathname: string;
	params: Record<string, string>;
	path?: string;
	handle?: unknown;
}
