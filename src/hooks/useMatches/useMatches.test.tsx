import { createContext, useContext } from "react";
import { render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLocationStore } from "@stores/location";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import type { MatchRecord } from "@contexts/MatchesContext";
import { NavigatorContext } from "@contexts/NavigatorContext";
import { RoutesContext } from "@contexts/RoutesContext";
import { Outlet } from "@components/Outlet";
import { Route } from "@components/Route";
import { Routes } from "@components/Routes";
import { act, render } from "../../test-utils";
import { useMatches } from "./useMatches";

let capturedMatches: MatchRecord[] | null = null;

const TestHarness = () => {
	capturedMatches = useMatches();
	return null;
};

describe("useMatches", () => {
	beforeEach(() => {
		capturedMatches = null;
	});

	it("Should return an empty array When used outside a <Routes> component", () => {
		rtlRender(<TestHarness />);

		expect(capturedMatches).toEqual([]);
	});

	it("Should return a single match When a root route matches the pathname", () => {
		render(
			<Routes>
				<Route path="about" element={<TestHarness />} />
			</Routes>,
			{ location: { pathname: "/about", search: "", hash: "" } },
		);

		expect(capturedMatches).toHaveLength(1);
		expect(capturedMatches![0].pathname).toBe("/about");
		expect(capturedMatches![0].params).toEqual({});
		expect(capturedMatches![0].path).toBe("about");
	});

	it("Should return a chain of matches When routes are nested", () => {
		let leafMatches: MatchRecord[] | null = null;

		const LeafCapture = () => {
			leafMatches = useMatches();
			return null;
		};

		render(
			<Routes>
				<Route path="blog" element={<Outlet />}>
					<Route path=":postId" element={<LeafCapture />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/blog/hello-world", search: "", hash: "" } },
		);

		expect(leafMatches).toHaveLength(2);
		expect(leafMatches![0].pathname).toBe("/blog");
		expect(leafMatches![0].params).toEqual({});
		expect(leafMatches![0].path).toBe("blog");

		expect(leafMatches![1].pathname).toBe("/blog/hello-world");
		expect(leafMatches![1].params).toEqual({ postId: "hello-world" });
		expect(leafMatches![1].path).toBe(":postId");
	});

	it("Should include handle in the match record When a route defines a handle", () => {
		const handle = { crumb: "About Us", icon: "info" };

		render(
			<Routes>
				<Route path="about" element={<TestHarness />} handle={handle} />
			</Routes>,
			{ location: { pathname: "/about", search: "", hash: "" } },
		);

		expect(capturedMatches![0].handle).toBe(handle);
	});

	it("Should set handle to undefined When a route does not define a handle", () => {
		render(
			<Routes>
				<Route path="about" element={<TestHarness />} />
			</Routes>,
			{ location: { pathname: "/about", search: "", hash: "" } },
		);

		expect(capturedMatches![0].handle).toBeUndefined();
	});

	it("Should set path to undefined When a route is a layout without path", () => {
		render(
			<Routes>
				<Route element={<TestHarness />} />
			</Routes>,
			{ location: { pathname: "/", search: "", hash: "" } },
		);

		expect(capturedMatches![0].path).toBeUndefined();
	});

	it("Should set path to undefined When a route is an index route", () => {
		render(
			<Routes>
				<Route index element={<TestHarness />} />
			</Routes>,
			{ location: { pathname: "/", search: "", hash: "" } },
		);

		expect(capturedMatches![0].path).toBeUndefined();
	});

	it("Should return the same array reference When the matches have not changed between renders", () => {
		const ForceRenderContext = createContext(0);

		const ForceRenderCapture = () => {
			useContext(ForceRenderContext);
			return <TestHarness />;
		};

		const store1 = createLocationStore({ pathname: "/about", search: "", hash: "" }, "");
		const store2 = createLocationStore({ pathname: "/about", search: "", hash: "" }, "");

		const { rerender } = rtlRender(
			<ForceRenderContext.Provider value={0}>
				<LocationStoreContext.Provider value={store1}>
					<NavigatorContext.Provider value={vi.fn()}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<Routes>
								<Route path="about" element={<ForceRenderCapture />} />
							</Routes>
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</ForceRenderContext.Provider>,
		);

		const first = capturedMatches;

		act(() => {
			rerender(
				<ForceRenderContext.Provider value={1}>
					<LocationStoreContext.Provider value={store2}>
						<NavigatorContext.Provider value={vi.fn()}>
							<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
								<Routes>
									<Route path="about" element={<ForceRenderCapture />} />
								</Routes>
							</RoutesContext.Provider>
						</NavigatorContext.Provider>
					</LocationStoreContext.Provider>
				</ForceRenderContext.Provider>,
			);
		});

		expect(capturedMatches).toBe(first);
	});

	it("Should return a new array reference When the pathname changes between renders", () => {
		const store1 = createLocationStore({ pathname: "/about", search: "", hash: "" }, "");
		const store2 = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");

		const { rerender } = rtlRender(
			<LocationStoreContext.Provider value={store1}>
				<NavigatorContext.Provider value={vi.fn()}>
					<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
						<Routes>
							<Route path="about" element={<TestHarness />} />
							<Route path="home" element={<TestHarness />} />
						</Routes>
					</RoutesContext.Provider>
				</NavigatorContext.Provider>
			</LocationStoreContext.Provider>,
		);

		const first = capturedMatches;

		act(() => {
			rerender(
				<LocationStoreContext.Provider value={store2}>
					<NavigatorContext.Provider value={vi.fn()}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<Routes>
								<Route path="about" element={<TestHarness />} />
								<Route path="home" element={<TestHarness />} />
							</Routes>
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>,
			);
		});

		expect(capturedMatches).not.toBe(first);
	});

	it("Should accumulate pathname correctly across three nesting levels", () => {
		let deepMatches: MatchRecord[] | null = null;

		const DeepCapture = () => {
			deepMatches = useMatches();
			return null;
		};

		render(
			<Routes>
				<Route element={<Outlet />}>
					<Route path="dashboard" element={<Outlet />}>
						<Route path="settings" element={<DeepCapture />} />
					</Route>
				</Route>
			</Routes>,
			{ location: { pathname: "/dashboard/settings", search: "", hash: "" } },
		);

		expect(deepMatches).toHaveLength(3);
		expect(deepMatches![0].pathname).toBe("/");
		expect(deepMatches![1].pathname).toBe("/dashboard");
		expect(deepMatches![2].pathname).toBe("/dashboard/settings");
	});

	it("Should capture wildcard param in the match record params", () => {
		render(
			<Routes>
				<Route path="docs/*" element={<TestHarness />} />
			</Routes>,
			{ location: { pathname: "/docs/getting-started/intro", search: "", hash: "" } },
		);

		expect(capturedMatches).toHaveLength(1);
		expect(capturedMatches![0].params).toEqual({ "*": "getting-started/intro" });
		expect(capturedMatches![0].pathname).toBe("/docs/getting-started/intro");
	});

	it("Should not include parent params in child level match record", () => {
		let leafMatches: MatchRecord[] | null = null;

		const LeafCapture = () => {
			leafMatches = useMatches();
			return null;
		};

		render(
			<Routes>
				<Route path="org/:orgId" element={<Outlet />}>
					<Route path="team/:teamId" element={<LeafCapture />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/org/7/team/3", search: "", hash: "" } },
		);

		expect(leafMatches![0].pathname).toBe("/org/7");
		expect(leafMatches![0].params).toEqual({ orgId: "7" });

		expect(leafMatches![1].pathname).toBe("/org/7/team/3");
		expect(leafMatches![1].params).toEqual({ teamId: "3" });
	});
});
