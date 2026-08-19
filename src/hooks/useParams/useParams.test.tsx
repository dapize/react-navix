import { createContext, useContext } from "react";
import { act, render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLocationStore } from "@stores/location";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { NavigatorContext } from "@contexts/NavigatorContext";
import { ParamsContext } from "@contexts/ParamsContext";
import { RoutesContext } from "@contexts/RoutesContext";
import { Outlet } from "@components/Outlet";
import { Route } from "@components/Route";
import { Routes } from "@components/Routes";
import { render } from "../../test-utils";
import { useParams } from "./useParams";

let hookResult: ReturnType<typeof useParams> | null = null;

const TestHarness = () => {
	hookResult = useParams();
	return null;
};

let capturedNestedParams: Record<string, string> | null = null;

const NestedParamsCapture = () => {
	capturedNestedParams = useParams();
	return null;
};

let capturedParams: Record<string, string> | null = null;

describe("useParams", () => {
	beforeEach(() => {
		hookResult = null;
		capturedNestedParams = null;
		capturedParams = null;
	});

	it("Should return the params from context", () => {
		hookResult = null;
		rtlRender(
			<ParamsContext.Provider value={{ id: "123", slug: "hello-world" }}>
				<TestHarness />
			</ParamsContext.Provider>,
		);

		expect(hookResult).toEqual({ id: "123", slug: "hello-world" });
	});

	it("Should return empty object When no params are provided", () => {
		hookResult = null;
		rtlRender(
			<ParamsContext.Provider value={{}}>
				<TestHarness />
			</ParamsContext.Provider>,
		);

		expect(hookResult).toEqual({});
	});

	it("Should throw When used outside a <Routes> component", () => {
		expect(() => {
			rtlRender(<TestHarness />);
		}).toThrow("useParams() must be used inside a <Routes> component.");
	});

	it("Should return merged params from nested routes", () => {
		capturedNestedParams = null;

		render(
			<Routes>
				<Route path="org/:orgId" element={<Outlet />}>
					<Route path="team/:teamId" element={<NestedParamsCapture />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/org/7/team/3", search: "", hash: "" } },
		);

		expect(capturedNestedParams).toEqual({ orgId: "7", teamId: "3" });
	});

	it("Should return the same object reference When params values have not changed between renders", () => {
		capturedParams = null;

		const ForceRenderContext = createContext(0);

		const store1 = createLocationStore({ pathname: "/hello", search: "", hash: "" }, "");
		const store2 = createLocationStore({ pathname: "/hello", search: "", hash: "" }, "");

		const ParamsCapture = () => {
			useContext(ForceRenderContext);
			capturedParams = useParams();
			return null;
		};

		const { rerender } = rtlRender(
			<ForceRenderContext.Provider value={0}>
				<LocationStoreContext.Provider value={store1}>
					<NavigatorContext.Provider value={vi.fn()}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<Routes>
								<Route path=":slug" element={<ParamsCapture />} />
							</Routes>
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</ForceRenderContext.Provider>,
		);

		const first = capturedParams;
		expect(first).toEqual({ slug: "hello" });

		act(() => {
			rerender(
				<ForceRenderContext.Provider value={1}>
					<LocationStoreContext.Provider value={store2}>
						<NavigatorContext.Provider value={vi.fn()}>
							<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
								<Routes>
									<Route path=":slug" element={<ParamsCapture />} />
								</Routes>
							</RoutesContext.Provider>
						</NavigatorContext.Provider>
					</LocationStoreContext.Provider>
				</ForceRenderContext.Provider>,
			);
		});

		expect(capturedParams).toBe(first);
	});
});
