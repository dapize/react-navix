import { useEffect } from "react";

import { useLocationSelector } from "@hooks/useLocationSelector";

export const ScrollRestoration = () => {
	const pathname = useLocationSelector((loc) => loc.pathname);

	useEffect(() => {
		if (!("scrollRestoration" in window.history)) return;
		const original = window.history.scrollRestoration;
		window.history.scrollRestoration = "manual";
		return () => {
			window.history.scrollRestoration = original;
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: must re-run effect when pathname changes
	useEffect(() => {
		window.scrollTo?.({ top: 0, behavior: "instant" });
	}, [pathname]);

	return null;
};
