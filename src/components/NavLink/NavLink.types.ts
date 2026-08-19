import type { CSSProperties } from "react";

import type { LinkProps } from "../Link";

export interface NavLinkProps extends LinkProps {
	activeClassName?: string;
	activeStyle?: CSSProperties;
	exact?: boolean;
	end?: boolean;
}
