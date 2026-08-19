export const getRouteResolutionBase = (consumed: string, params: Record<string, string>): string => {
	const splat = params["*"];
	if (splat === undefined) return consumed;

	const suffix = `/${splat}`;
	if (consumed.endsWith(suffix)) {
		return consumed.slice(0, -suffix.length) || "/";
	}

	return consumed;
};
