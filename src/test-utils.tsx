import type { ComponentType, ReactElement, ReactNode } from "react";
import { type RenderResult, type RenderOptions as RTLRenderOptions, render as rtlRender } from "@testing-library/react";
import { vi } from "vitest";

import { type BlockerRegistry, createBlockerRegistry } from "@stores/blockers";
import { createLocationStore, type Location, type LocationStore } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { type NavigateFunction, NavigatorContext } from "@contexts/NavigatorContext";
import { RoutesContext } from "@contexts/RoutesContext";

export interface CustomRenderOptions extends Omit<RTLRenderOptions, "wrapper"> {
	location?: Location;
	navigate?: NavigateFunction;
	prefix?: string;
	routeBase?: string;
	params?: Record<string, string>;
	wrapper?: ComponentType<{ children: ReactNode }>;
}

export interface CustomRenderResult extends RenderResult {
	store: LocationStore;
	navigate: NavigateFunction;
	blockerRegistry: BlockerRegistry;
}

const DEFAULT_LOCATION: Location = { pathname: "/", search: "", hash: "" };

export const render = (ui: ReactElement, options?: CustomRenderOptions): CustomRenderResult => {
	const {
		location = DEFAULT_LOCATION,
		navigate: navigateProp,
		prefix = "",
		routeBase = "",
		params = {},
		wrapper: UserWrapper,
		...rtlOptions
	} = options ?? {};

	const store = createLocationStore(location, prefix);
	const navigate = navigateProp ?? vi.fn();
	const blockerRegistry = createBlockerRegistry();

	const DefaultWrapper = ({ children }: { children: ReactNode }) => (
		<BlockerRegistryContext.Provider value={blockerRegistry}>
			<NavigatorContext.Provider value={navigate}>
				<LocationStoreContext.Provider value={store}>
					<RoutesContext.Provider value={{ params, routeBase }}>{children}</RoutesContext.Provider>
				</LocationStoreContext.Provider>
			</NavigatorContext.Provider>
		</BlockerRegistryContext.Provider>
	);

	const FinalWrapper = UserWrapper
		? ({ children }: { children: ReactNode }) => (
				<UserWrapper>
					<DefaultWrapper>{children}</DefaultWrapper>
				</UserWrapper>
			)
		: DefaultWrapper;

	const rtlResult = rtlRender(ui, { wrapper: FinalWrapper, ...rtlOptions });

	return { ...rtlResult, store, navigate, blockerRegistry };
};

export { act, screen } from "@testing-library/react";
