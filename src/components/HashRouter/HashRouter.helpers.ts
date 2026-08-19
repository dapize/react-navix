import { safeDecode } from "@helpers/safeDecode";
import { stripBasename } from "@helpers/stripBasename";
import type { Location } from "@stores/location";

export const extractLocationFromHash = (basename: string): Location => {
	const raw = window.location.hash;
	let content = raw.startsWith("#") ? raw.slice(1) : raw;

	content = stripBasename(content, basename);

	const hashIndex = content.indexOf("#");
	const hashPart = hashIndex !== -1 ? content.slice(hashIndex) : "";
	const beforeHash = hashIndex !== -1 ? content.slice(0, hashIndex) : content;

	const searchIndex = beforeHash.indexOf("?");

	if (searchIndex === -1) {
		return {
			pathname: safeDecode(beforeHash || "/"),
			search: "",
			hash: hashPart,
			state: window.history.state?.usr,
			key: window.history.state?.key,
		};
	}

	return {
		pathname: safeDecode(beforeHash.slice(0, searchIndex) || "/"),
		search: beforeHash.slice(searchIndex),
		hash: hashPart,
		state: window.history.state?.usr,
		key: window.history.state?.key,
	};
};
