import { createElement, useContext } from "react";

import { OUTLET_CONTEXT_SENTINEL, OutletDataContext } from "@contexts/OutletDataContext";
import { OutletContext } from "@contexts/RoutesContext";
import type { OutletProps } from "./Outlet.types";

export const Outlet = ({ context }: OutletProps) => {
	const outletContent = useContext(OutletContext);

	if (outletContent === null || outletContent === undefined) return null;

	if (context !== undefined) {
		return createElement(OutletDataContext.Provider, { value: context }, outletContent);
	}

	return createElement(OutletDataContext.Provider, { value: OUTLET_CONTEXT_SENTINEL }, outletContent);
};
