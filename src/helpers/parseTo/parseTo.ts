import { safeDecode } from "@helpers/safeDecode";

export const parseTo = (to: string) => {
	const firstChar = to[0];
	const normalized = to === "" || firstChar === "/" || firstChar === "?" || firstChar === "#" ? to : `/${to}`;
	const url = new URL(`http://p${normalized}`);
	return {
		pathname: safeDecode(url.pathname),
		search: url.search,
		hash: url.hash,
	};
};
