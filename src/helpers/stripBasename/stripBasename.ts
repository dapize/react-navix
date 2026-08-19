const isSegmentBoundary = (char: string | undefined): boolean => char === "/" || char === "?" || char === "#" || char === undefined;

export const stripBasename = (pathname: string, basename: string): string => {
	if (!basename || basename === "/") return pathname;

	const normalizedBase = basename.replace(/\/$/, "");
	if (!pathname.startsWith(normalizedBase)) return pathname;

	if (!isSegmentBoundary(pathname[normalizedBase.length])) return pathname;

	return pathname.slice(normalizedBase.length) || "/";
};
