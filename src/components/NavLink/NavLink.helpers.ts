const stripTrailingSlash = (path: string): string => {
	return path.replace(/\/$/, "") || "/";
};

export const isActive = (targetPath: string, currentPath: string, exact: boolean): boolean => {
	const normalizedTarget = stripTrailingSlash(targetPath);
	const normalizedCurrent = stripTrailingSlash(currentPath);

	if (normalizedTarget === normalizedCurrent) {
		return true;
	}

	if (exact) {
		return false;
	}

	if (normalizedTarget === "/") {
		return false;
	}

	if (!normalizedCurrent.startsWith(normalizedTarget)) {
		return false;
	}

	return normalizedCurrent.charAt(normalizedTarget.length) === "/";
};
