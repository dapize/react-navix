import { useContext } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RoutesContext } from "@contexts/RoutesContext";
import { useLocation } from "@hooks/useLocation";
import { useNavigate } from "@hooks/useNavigate";
import { useResetErrorBoundary } from "@hooks/useResetErrorBoundary";
import { useRouteError } from "@hooks/useRouteError";
import { act, render, screen } from "../../test-utils";
import { Outlet } from "../Outlet";
import { Route } from "../Route";
import { Routes } from "./Routes";

let capturedRouteBase = "";

const RouteBaseCapture = () => {
	const { routeBase } = useContext(RoutesContext);
	capturedRouteBase = routeBase;
	return null;
};

const InnerRoutesWithIndex = () => (
	<Routes>
		<Route index element={<h1>Dashboard</h1>} />
		<Route path="settings" element={<h1>Settings</h1>} />
	</Routes>
);

describe("Routes", () => {
	beforeEach(() => {
		capturedRouteBase = "";
	});

	it("Should render the matching route element When pathname matches exactly", () => {
		render(
			<Routes>
				<Route path="about" element={<h1>About</h1>} />
				<Route path="home" element={<h1>Home</h1>} />
			</Routes>,
			{ location: { pathname: "/about", search: "", hash: "" } },
		);

		expect(screen.getByText("About")).toBeInTheDocument();
	});

	it("Should render the index route When pathname equals parent basePath", () => {
		render(
			<Routes>
				<Route index element={<h2>Dashboard Index</h2>} />
				<Route path="settings" element={<h2>Settings</h2>} />
			</Routes>,
			{ location: { pathname: "/dashboard", search: "", hash: "" }, routeBase: "/dashboard" },
		);

		expect(screen.getByText("Dashboard Index")).toBeInTheDocument();
	});

	it("Should render the nested child When URL extends beyond parent prefix", () => {
		const { container } = render(
			<Routes>
				<Route
					path="users"
					element={
						<>
							Users
							<Outlet />
						</>
					}
				>
					<Route path=":id" element={<span>UserDetail</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/users/42", search: "", hash: "" } },
		);

		expect(container.textContent).toContain("Users");
		expect(container.textContent).toContain("UserDetail");
	});

	it("Should render the wildcard catch-all When no other route matches", () => {
		render(
			<Routes>
				<Route path="about" element={<h1>About</h1>} />
				<Route path="*" element={<h1>Not Found</h1>} />
			</Routes>,
			{ location: { pathname: "/nonexistent", search: "", hash: "" } },
		);

		expect(screen.getByText("Not Found")).toBeInTheDocument();
	});

	it("Should not render a leaf route When pathname extends beyond its path", () => {
		render(
			<Routes>
				<Route path="users" element={<h1>Users List</h1>} />
				<Route path="users/42" element={<h1>User 42</h1>} />
			</Routes>,
			{ location: { pathname: "/users/42", search: "", hash: "" } },
		);

		expect(screen.getByText("User 42")).toBeInTheDocument();
	});

	it("Should render the first matching sibling When multiple routes could match", () => {
		render(
			<Routes>
				<Route path="users" element={<h1>Users</h1>} />
				<Route path="users/new" element={<h1>New User</h1>} />
			</Routes>,
			{ location: { pathname: "/users/new", search: "", hash: "" } },
		);

		expect(screen.getByText("New User")).toBeInTheDocument();
	});

	it("Should render null When no route matches", () => {
		const { container } = render(
			<Routes>
				<Route path="about" element={<h1>About</h1>} />
			</Routes>,
			{ location: { pathname: "/settings", search: "", hash: "" } },
		);

		expect(container.textContent).toBe("");
	});

	it("Should render null When a matched route has a path but no element or children", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const { container } = render(
			<Routes>
				<Route path="orphan" />
			</Routes>,
			{ location: { pathname: "/orphan", search: "", hash: "" } },
		);

		expect(container.textContent).toBe("");

		warnSpy.mockRestore();
	});

	it("Should pass params through nested routes", () => {
		const { container } = render(
			<Routes>
				<Route
					path="org/:orgId"
					element={
						<>
							Org
							<Outlet />
						</>
					}
				>
					<Route path="team/:teamId" element={<span>Team</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/org/7/team/3", search: "", hash: "" } },
		);

		expect(container.textContent).toContain("Org");
		expect(container.textContent).toContain("Team");
	});

	it("Should render nested wildcard child When parent Route has wildcard path", () => {
		const { container } = render(
			<Routes>
				<Route
					path="explorador/*"
					element={
						<>
							Layout
							<Outlet />
						</>
					}
				>
					<Route path="*" element={<span>Archivo</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/explorador/imagenes/gato.jpg", search: "", hash: "" } },
		);

		expect(container.textContent).toContain("Layout");
		expect(container.textContent).toContain("Archivo");
	});

	it("Should render nested wildcard child When parent has wildcard and URL matches the wildcard prefix exactly", () => {
		const { container } = render(
			<Routes>
				<Route
					path="explorador/*"
					element={
						<>
							Layout
							<Outlet />
						</>
					}
				>
					<Route path="*" element={<span>RootDir</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/explorador", search: "", hash: "" } },
		);

		expect(container.textContent).toContain("Layout");
		expect(container.textContent).toContain("RootDir");
	});

	it("Should render nested wildcard child When parent has wildcard and URL has multi-level deep path", () => {
		const { container } = render(
			<Routes>
				<Route
					path="docs/*"
					element={
						<>
							DocLayout
							<Outlet />
						</>
					}
				>
					<Route path="*" element={<span>DocContent</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/docs/reference/v3/api/endpoints", search: "", hash: "" } },
		);

		expect(container.textContent).toContain("DocLayout");
		expect(container.textContent).toContain("DocContent");
	});

	it("Should render named child route When parent uses wildcard and nested children use buildOutlet path", () => {
		const { container } = render(
			<Routes>
				<Route path="category/*">
					<Route path="products" element={<span>Products</span>} />
					<Route path="about" element={<span>About</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/category/products", search: "", hash: "" } },
		);

		expect(container.textContent).toContain("Products");
	});

	it("Should render index child When parent uses wildcard and URL matches prefix exactly", () => {
		render(
			<Routes>
				<Route path="category/*">
					<Route index element={<h2>Category Home</h2>} />
					<Route path="products" element={<span>Products</span>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/category", search: "", hash: "" } },
		);

		expect(screen.getByText("Category Home")).toBeInTheDocument();
	});

	it("Should render index route When inner Routes is element of wildcard parent and URL matches prefix", () => {
		render(
			<Routes>
				<Route path="admin/*" element={<InnerRoutesWithIndex />} />
			</Routes>,
			{ location: { pathname: "/admin", search: "", hash: "" } },
		);

		expect(screen.getByText("Dashboard")).toBeInTheDocument();
	});

	it("Should render named route When inner Routes is element of wildcard parent and URL extends beyond prefix", () => {
		render(
			<Routes>
				<Route path="admin/*" element={<InnerRoutesWithIndex />} />
			</Routes>,
			{ location: { pathname: "/admin/settings", search: "", hash: "" } },
		);

		expect(screen.getByText("Settings")).toBeInTheDocument();
	});
});

it("Should render nested child routes When parent Route has no element", () => {
	render(
		<Routes>
			<Route path="docs">
				<Route index element={<h2>Docs Index</h2>} />
				<Route path="instalacion" element={<h2>Instalacion</h2>} />
			</Route>
		</Routes>,
		{ location: { pathname: "/docs/instalacion", search: "", hash: "" } },
	);

	expect(screen.getByText("Instalacion")).toBeInTheDocument();
});

it("Should render the index child When parent Route without element matches exactly", () => {
	render(
		<Routes>
			<Route path="docs">
				<Route index element={<h2>Docs Index</h2>} />
				<Route path="instalacion" element={<h2>Instalacion</h2>} />
			</Route>
		</Routes>,
		{ location: { pathname: "/docs", search: "", hash: "" } },
	);

	expect(screen.getByText("Docs Index")).toBeInTheDocument();
});

it("Should set routeBase to the static prefix excluding splat When wildcard route matches deeply", () => {
	render(
		<Routes>
			<Route path="docs/*" element={<RouteBaseCapture />} />
		</Routes>,
		{ location: { pathname: "/docs/reference/v3/api", search: "", hash: "" } },
	);

	expect(capturedRouteBase).toBe("/docs");
});

it("Should set routeBase to the consumed path When wildcard matches empty suffix", () => {
	render(
		<Routes>
			<Route path="docs/*" element={<RouteBaseCapture />} />
		</Routes>,
		{ location: { pathname: "/docs", search: "", hash: "" } },
	);

	expect(capturedRouteBase).toBe("/docs");
});

const Thrower = ({ message }: { message: string }) => {
	throw new Error(message);
};

let throwerRenderCount = 0;

const CountingThrower = ({ message }: { message: string }) => {
	throwerRenderCount++;
	throw new Error(message);
};

let capturedLocationInError: unknown = null;
let capturedNavigateInError: unknown = null;

const HookCaptureErrorElement = () => {
	capturedLocationInError = useLocation();
	capturedNavigateInError = useNavigate();
	return <span data-testid="hooks-ok">hooks work</span>;
};

const BrokenErrorElement = () => {
	useRouteError();
	throw new Error("errorElement crashed");
};

const RouteErrorDisplay = () => {
	const error = useRouteError();
	return <span data-testid="route-error">{(error as Error).message}</span>;
};

const ResetErrorDisplay = () => {
	const error = useRouteError();
	const reset = useResetErrorBoundary();
	return (
		<div>
			<span data-testid="route-error">{(error as Error).message}</span>
			<button type="button" data-testid="reset-button" onClick={reset}>
				Retry
			</button>
		</div>
	);
};

describe("Error Boundaries", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		throwerRenderCount = 0;
		capturedLocationInError = null;
		capturedNavigateInError = null;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("Should render errorElement When matched route element throws", () => {
		render(
			<Routes>
				<Route path="broken" element={<Thrower message="route crashed" />} errorElement={<h1>Error Fallback</h1>} />
			</Routes>,
			{ location: { pathname: "/broken", search: "", hash: "" } },
		);

		expect(screen.getByText("Error Fallback")).toBeInTheDocument();
	});

	it("Should render parent errorElement When child route without errorElement throws", () => {
		render(
			<Routes>
				<Route
					path="dashboard"
					element={
						<>
							Dashboard
							<Outlet />
						</>
					}
					errorElement={<h1>Dashboard Error</h1>}
				>
					<Route path="settings" element={<Thrower message="settings error" />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/dashboard/settings", search: "", hash: "" } },
		);

		expect(screen.getByText("Dashboard Error")).toBeInTheDocument();
		expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
	});

	it("Should render own errorElement When child route has its own errorElement and throws", () => {
		render(
			<Routes>
				<Route
					path="dashboard"
					element={
						<>
							Dashboard
							<Outlet />
						</>
					}
					errorElement={<h1>Dashboard Error</h1>}
				>
					<Route path="settings" element={<Thrower message="settings error" />} errorElement={<h1>Settings Error</h1>} />
				</Route>
			</Routes>,
			{ location: { pathname: "/dashboard/settings", search: "", hash: "" } },
		);

		expect(screen.getByText("Settings Error")).toBeInTheDocument();
		expect(screen.queryByText("Dashboard Error")).not.toBeInTheDocument();
	});

	it("Should provide error via useRouteError When rendered inside an errorElement", () => {
		render(
			<Routes>
				<Route path="broken" element={<Thrower message="route crashed" />} errorElement={<RouteErrorDisplay />} />
			</Routes>,
			{ location: { pathname: "/broken", search: "", hash: "" } },
		);

		expect(screen.getByTestId("route-error")).toHaveTextContent("route crashed");
	});

	it("Should render errorElement When route without element has children that throw", () => {
		render(
			<Routes>
				<Route path="docs" errorElement={<h1>Docs Error</h1>}>
					<Route path="broken" element={<Thrower message="child error" />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/docs/broken", search: "", hash: "" } },
		);

		expect(screen.getByText("Docs Error")).toBeInTheDocument();
	});

	it("Should reset error boundary When navigating to a different route", () => {
		const { store } = render(
			<Routes>
				<Route path="broken" element={<Thrower message="route crashed" />} errorElement={<h1>Error Fallback</h1>} />
				<Route path="safe" element={<h1>Safe Page</h1>} />
			</Routes>,
			{ location: { pathname: "/broken", search: "", hash: "" } },
		);

		expect(screen.getByText("Error Fallback")).toBeInTheDocument();

		act(() => {
			store.setLocation({ pathname: "/safe", search: "", hash: "" });
		});

		expect(screen.getByText("Safe Page")).toBeInTheDocument();
		expect(screen.queryByText("Error Fallback")).not.toBeInTheDocument();
	});

	it("Should render errorElement with access to params When route has dynamic segments", () => {
		const ParamsErrorDisplay = () => {
			const error = useRouteError();
			return <span data-testid="param-error">Error: {(error as Error).message}</span>;
		};

		render(
			<Routes>
				<Route path="users/:userId" element={<Thrower message="user not found" />} errorElement={<ParamsErrorDisplay />} />
			</Routes>,
			{ location: { pathname: "/users/42", search: "", hash: "" } },
		);

		expect(screen.getByTestId("param-error")).toHaveTextContent("user not found");
	});

	it("Should not render errorElement When route without errorElement has element that does not throw", () => {
		render(
			<Routes>
				<Route path="safe" element={<h1>Safe Page</h1>} />
			</Routes>,
			{ location: { pathname: "/safe", search: "", hash: "" } },
		);

		expect(screen.getByText("Safe Page")).toBeInTheDocument();
	});

	it("Should allow resetErrorBoundary to retry rendering the element", () => {
		render(
			<Routes>
				<Route path="fragile" element={<Thrower message="temporary crash" />} errorElement={<ResetErrorDisplay />} />
			</Routes>,
			{ location: { pathname: "/fragile", search: "", hash: "" } },
		);

		expect(screen.getByTestId("route-error")).toHaveTextContent("temporary crash");

		act(() => {
			screen.getByTestId("reset-button").click();
		});

		expect(screen.getByTestId("route-error")).toHaveTextContent("temporary crash");
	});

	it("Should give up (render null) after three consecutive errors When reset is triggered repeatedly", () => {
		render(
			<Routes>
				<Route path="fragile" element={<CountingThrower message="always crashes" />} errorElement={<ResetErrorDisplay />} />
			</Routes>,
			{ location: { pathname: "/fragile", search: "", hash: "" } },
		);

		expect(screen.getByTestId("route-error")).toHaveTextContent("always crashes");

		act(() => {
			screen.getByTestId("reset-button").click();
		});

		expect(screen.getByTestId("route-error")).toHaveTextContent("always crashes");

		act(() => {
			screen.getByTestId("reset-button").click();
		});

		expect(screen.getByTestId("route-error")).toHaveTextContent("always crashes");

		act(() => {
			screen.getByTestId("reset-button").click();
		});

		expect(screen.queryByTestId("route-error")).not.toBeInTheDocument();
	});

	it("Should not catch errors from sibling routes When only one has errorElement", () => {
		render(
			<Routes>
				<Route path="broken" element={<Thrower message="first error" />} errorElement={<h1>Broken Error</h1>} />
				<Route path="working" element={<h1>Working</h1>} />
			</Routes>,
			{ location: { pathname: "/working", search: "", hash: "" } },
		);

		expect(screen.getByText("Working")).toBeInTheDocument();
		expect(screen.queryByText("Broken Error")).not.toBeInTheDocument();
	});

	it("Should reset error boundary When navigating to the same route with a different location key", () => {
		const { store } = render(
			<Routes>
				<Route path="fragile" element={<CountingThrower message="crash" />} errorElement={<h1>Error Fallback</h1>} />
			</Routes>,
			{ location: { pathname: "/fragile", search: "", hash: "", key: "first" } },
		);

		expect(screen.getByText("Error Fallback")).toBeInTheDocument();
		const initialCount = throwerRenderCount;
		expect(initialCount).toBeGreaterThan(0);

		act(() => {
			store.setLocation({ pathname: "/fragile", search: "?v=2", hash: "", key: "second" });
		});

		expect(throwerRenderCount).toBeGreaterThan(initialCount);
		expect(screen.getByText("Error Fallback")).toBeInTheDocument();
	});

	it("Should not hang When errorElement itself throws repeatedly", () => {
		expect(() => {
			render(
				<Routes>
					<Route path="broken" element={<Thrower message="initial crash" />} errorElement={<BrokenErrorElement />} />
				</Routes>,
				{ location: { pathname: "/broken", search: "", hash: "" } },
			);
		}).toThrow("errorElement crashed");
	});

	it("Should provide useLocation and useNavigate inside the errorElement", () => {
		render(
			<Routes>
				<Route path="broken" element={<Thrower message="crash" />} errorElement={<HookCaptureErrorElement />} />
			</Routes>,
			{ location: { pathname: "/broken", search: "?q=test", hash: "" } },
		);

		expect(screen.getByTestId("hooks-ok")).toBeInTheDocument();
		expect(capturedLocationInError).toBeTruthy();
		expect(typeof capturedNavigateInError).toBe("function");
	});

	it("Should propagate error through multiple nesting levels When intermediate routes lack errorElement", () => {
		render(
			<Routes>
				<Route
					path="grandparent"
					element={
						<>
							<span>Grandparent</span>
							<Outlet />
						</>
					}
					errorElement={<h1>Grandparent Error</h1>}
				>
					<Route
						path="parent"
						element={
							<>
								<span>Parent</span>
								<Outlet />
							</>
						}
					>
						<Route path="child" element={<Thrower message="deep child error" />} />
					</Route>
				</Route>
			</Routes>,
			{ location: { pathname: "/grandparent/parent/child", search: "", hash: "" } },
		);

		expect(screen.getByText("Grandparent Error")).toBeInTheDocument();
		expect(screen.queryByText("Grandparent")).not.toBeInTheDocument();
		expect(screen.queryByText("Parent")).not.toBeInTheDocument();
	});

	it("Should render errorElement When wildcard route element throws", () => {
		render(
			<Routes>
				<Route path="docs/*" element={<Thrower message="docs error" />} errorElement={<h1>Docs Error</h1>} />
			</Routes>,
			{ location: { pathname: "/docs/reference/v3/api", search: "", hash: "" } },
		);

		expect(screen.getByText("Docs Error")).toBeInTheDocument();
	});

	it("Should propagate errors normally When no route in the tree has errorElement", () => {
		expect(() => {
			render(
				<Routes>
					<Route path="broken" element={<Thrower message="uncaught" />} />
				</Routes>,
				{ location: { pathname: "/broken", search: "", hash: "" } },
			);
		}).toThrow("uncaught");
	});
});
