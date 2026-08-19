export interface NavigateProps {
	to: string;
	replace?: boolean;
	relative?: "route" | "path";
	state?: unknown;
}
