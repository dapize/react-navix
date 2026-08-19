import { render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Outlet } from "@components/Outlet";
import { Route } from "@components/Route";
import { Routes } from "@components/Routes";
import { render } from "../../test-utils";
import { useOutletContext } from "./useOutletContext";

let capturedContext: unknown;

const TestHarness = () => {
	capturedContext = useOutletContext();
	return null;
};

describe("useOutletContext", () => {
	beforeEach(() => {
		capturedContext = undefined;
	});

	it("Should throw When used outside a route rendered by <Outlet context={...} />", () => {
		expect(() => {
			rtlRender(<TestHarness />);
		}).toThrow("useOutletContext() must be used inside a child route rendered by <Outlet context={...} />.");
	});

	it("Should return the context value When a parent layout provides context via <Outlet context={...} />", () => {
		const Layout = () => (
			<div>
				<Outlet context={{ user: "Alice", role: "admin" }} />
			</div>
		);

		render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<TestHarness />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/", search: "", hash: "" } },
		);

		expect(capturedContext).toEqual({ user: "Alice", role: "admin" });
	});

	it("Should throw When the Outlet does not provide a context prop", () => {
		const Layout = () => (
			<div>
				<Outlet />
			</div>
		);

		expect(() => {
			render(
				<Routes>
					<Route element={<Layout />}>
						<Route index element={<TestHarness />} />
					</Route>
				</Routes>,
				{ location: { pathname: "/", search: "", hash: "" } },
			);
		}).toThrow("useOutletContext() must be used inside a child route rendered by <Outlet context={...} />.");
	});

	it("Should return null When the context value is explicitly null", () => {
		const Layout = () => (
			<div>
				<Outlet context={null} />
			</div>
		);

		render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<TestHarness />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/", search: "", hash: "" } },
		);

		expect(capturedContext).toBeNull();
	});

	it("Should return a primitive value When the context is a primitive", () => {
		const Layout = () => (
			<div>
				<Outlet context={42} />
			</div>
		);

		render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<TestHarness />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/", search: "", hash: "" } },
		);

		expect(capturedContext).toBe(42);
	});

	it("Should provide independent contexts When sibling routes use different context values", () => {
		const AdminLayout = () => (
			<div>
				<Outlet context={{ role: "admin" }} />
			</div>
		);

		let adminContext: unknown;

		const AdminCapture = () => {
			adminContext = useOutletContext();
			return null;
		};

		render(
			<Routes>
				<Route element={<AdminLayout />}>
					<Route path="admin" element={<AdminCapture />} />
				</Route>
			</Routes>,
			{ location: { pathname: "/admin", search: "", hash: "" } },
		);

		expect(adminContext).toEqual({ role: "admin" });
	});

	it("Should pass the innermost context When nested layouts each provide their own context", () => {
		const OuterLayout = () => (
			<div>
				<Outlet context={{ level: "outer" }} />
			</div>
		);

		const InnerLayout = () => (
			<div>
				<Outlet context={{ level: "inner" }} />
			</div>
		);

		let leafValue: unknown;

		const LeafCapture = () => {
			leafValue = useOutletContext();
			return null;
		};

		render(
			<Routes>
				<Route element={<OuterLayout />}>
					<Route element={<InnerLayout />}>
						<Route index element={<LeafCapture />} />
					</Route>
				</Route>
			</Routes>,
			{ location: { pathname: "/", search: "", hash: "" } },
		);

		expect(leafValue).toEqual({ level: "inner" });
	});
});
