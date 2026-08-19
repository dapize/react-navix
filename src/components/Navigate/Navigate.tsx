import { useEffect, useRef } from "react";

import { useNavigate } from "@hooks/useNavigate";
import { deepEqual } from "./Navigate.helpers";
import type { NavigateProps } from "./Navigate.types";

export const Navigate = ({ to, replace = true, relative = "route", state }: NavigateProps) => {
	const navigate = useNavigate();
	const previousNavigateRef = useRef<NavigateProps | null>(null);

	useEffect(() => {
		const previous = previousNavigateRef.current;
		if (
			previous &&
			previous.to === to &&
			previous.replace === replace &&
			previous.relative === relative &&
			deepEqual(previous.state, state)
		) {
			return;
		}
		previousNavigateRef.current = { to, replace, relative, state };
		navigate(to, { replace, relative, state });
	}, [to, replace, relative, state, navigate]);

	return null;
};
