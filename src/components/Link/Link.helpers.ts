import type { MouseEvent } from "react";

export const isModifiedClick = (event: MouseEvent): boolean => event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;

export const hasExternalTarget = (event: MouseEvent<HTMLAnchorElement>): boolean => {
	const target = event.currentTarget.target;
	return Boolean(target) && target !== "_self";
};

export const shouldLetBrowserHandle = (event: MouseEvent<HTMLAnchorElement>): boolean =>
	event.button !== 0 || isModifiedClick(event) || hasExternalTarget(event) || event.defaultPrevented;
