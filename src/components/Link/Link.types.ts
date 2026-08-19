import type { AnchorHTMLAttributes } from "react";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	to: string;
	replace?: boolean;
	relative?: "route" | "path";
	state?: unknown;
}
