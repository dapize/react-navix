import { safeDecode } from "@helpers/safeDecode";
import { stripBasename } from "@helpers/stripBasename";
import type { Location } from "@stores/location";

export const extractLocationFromPathname = (basename: string): Location => {
	return {
		pathname: safeDecode(stripBasename(window.location.pathname, basename)),
		search: window.location.search,
		hash: window.location.hash,
		state: window.history.state?.usr,
		key: window.history.state?.key,
	};
};
