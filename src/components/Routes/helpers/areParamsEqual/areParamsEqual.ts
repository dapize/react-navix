export const areParamsEqual = (first: Record<string, string>, second: Record<string, string>): boolean => {
	const firstKeys = Object.keys(first);
	const secondKeys = Object.keys(second);
	if (firstKeys.length !== secondKeys.length) return false;
	return firstKeys.every((key) => first[key] === second[key]);
};
