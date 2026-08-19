export const resolvePath = (to: string, fromPathname: string): string => {
	if (to.startsWith("/")) return to;

	if (to.startsWith("?") || to.startsWith("#")) return fromPathname + to;

	if (to === "") return fromPathname;

	const hashIndex = to.indexOf("#");
	const hashPart = hashIndex !== -1 ? to.slice(hashIndex) : "";
	const beforeHash = hashIndex !== -1 ? to.slice(0, hashIndex) : to;

	const searchIndex = beforeHash.indexOf("?");
	const searchPart = searchIndex !== -1 ? beforeHash.slice(searchIndex) : "";
	const pathPart = searchIndex !== -1 ? beforeHash.slice(0, searchIndex) : beforeHash;

	const fromSegments = fromPathname.split("/").filter(Boolean);
	const toSegments = pathPart.split("/");

	for (const segment of toSegments) {
		if (segment === "..") {
			fromSegments.pop();
		} else if (segment !== "." && segment !== "") {
			fromSegments.push(segment);
		}
	}

	return `/${fromSegments.join("/")}${searchPart}${hashPart}`;
};
