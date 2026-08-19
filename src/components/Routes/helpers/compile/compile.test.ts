import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RouteProps } from "../../../Route";
import { compileRoutes } from "./compile";

const Route = (props: RouteProps): ReactNode => createElement("route", props);

describe("compileRoutes", () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	it("Should compile a static route and place it in the static bucket", () => {
		const bucket = compileRoutes(createElement(Route, { path: "users", element: "Users" }));

		const staticRoutes = bucket.static.get("users");
		expect(staticRoutes).toBeDefined();
		expect(staticRoutes).toHaveLength(1);
		expect(staticRoutes![0].segments).toEqual([{ type: "static", value: "users" }]);
		expect(staticRoutes![0].specificity).toBe(3);
		expect(staticRoutes![0].element).toBe("Users");
	});

	it("Should compile multiple static routes grouped by first segment", () => {
		const bucket = compileRoutes([
			createElement(Route, { path: "users", element: "Users" }),
			createElement(Route, { path: "users/new", element: "NewUser" }),
			createElement(Route, { path: "about", element: "About" }),
		]);

		expect(bucket.static.get("users")).toHaveLength(2);
		expect(bucket.static.get("about")).toHaveLength(1);
	});

	it("Should compile a dynamic route into the dynamic bucket", () => {
		const bucket = compileRoutes(createElement(Route, { path: ":id", element: "Detail" }));

		expect(bucket.dynamic).toHaveLength(1);
		expect(bucket.dynamic[0].segments).toEqual([{ type: "dynamic", value: "id" }]);
		expect(bucket.dynamic[0].specificity).toBe(2);
	});

	it("Should compile a route with mixed segment types into the correct bucket", () => {
		const bucket = compileRoutes(createElement(Route, { path: "users/:id/posts/:postId", element: "Post" }));

		const staticRoutes = bucket.static.get("users");
		expect(staticRoutes).toBeDefined();
		expect(staticRoutes![0].segments).toEqual([
			{ type: "static", value: "users" },
			{ type: "dynamic", value: "id" },
			{ type: "static", value: "posts" },
			{ type: "dynamic", value: "postId" },
		]);
		expect(staticRoutes![0].specificity).toBe(10);
	});

	it("Should compile a wildcard route into the wildcard bucket", () => {
		const bucket = compileRoutes(createElement(Route, { path: "*", element: "NotFound" }));

		expect(bucket.wildcard).toHaveLength(1);
		expect(bucket.wildcard[0].segments).toEqual([{ type: "wildcard", value: "*" }]);
		expect(bucket.wildcard[0].specificity).toBe(0);
	});

	it("Should compile a wildcard route with prefix into the corresponding static bucket", () => {
		const bucket = compileRoutes(createElement(Route, { path: "docs/*", element: "DocLayout" }));

		const staticRoutes = bucket.static.get("docs");
		expect(staticRoutes).toBeDefined();
		expect(staticRoutes![0].segments).toEqual([
			{ type: "static", value: "docs" },
			{ type: "wildcard", value: "*" },
		]);
		expect(staticRoutes![0].specificity).toBe(3);
	});

	it("Should compile an index route into the empty bucket", () => {
		const bucket = compileRoutes(createElement(Route, { index: true, element: "Home" }));

		expect(bucket.empty).toHaveLength(1);
		expect(bucket.empty[0].isIndex).toBe(true);
		expect(bucket.empty[0].segments).toHaveLength(0);
		expect(bucket.empty[0].specificity).toBe(0);
	});

	it("Should compile a route without path into the empty bucket", () => {
		const bucket = compileRoutes(createElement(Route, { element: "CatchAll" }));

		expect(bucket.empty).toHaveLength(1);
		expect(bucket.empty[0].isIndex).toBe(false);
		expect(bucket.empty[0].segments).toHaveLength(0);
		expect(bucket.empty[0].specificity).toBe(0);
	});

	it("Should compile a route with absolute path into the absolute bucket", () => {
		const bucket = compileRoutes(createElement(Route, { path: "/admin", element: "Admin" }));

		expect(bucket.absolute).toHaveLength(1);
		expect(bucket.absolute[0].isAbsolute).toBe(true);
		expect(bucket.absolute[0].segments).toEqual([{ type: "static", value: "admin" }]);
	});

	it("Should assign definition order sequentially", () => {
		const bucket = compileRoutes([
			createElement(Route, { path: "first", element: "A" }),
			createElement(Route, { path: "second", element: "B" }),
			createElement(Route, { path: "third", element: "C" }),
		]);

		const firstRoutes = bucket.static.get("first")!;
		const secondRoutes = bucket.static.get("second")!;
		const thirdRoutes = bucket.static.get("third")!;

		expect(firstRoutes[0].definitionOrder).toBe(0);
		expect(secondRoutes[0].definitionOrder).toBe(1);
		expect(thirdRoutes[0].definitionOrder).toBe(2);
	});

	it("Should preserve errorElement in the compiled route", () => {
		const errorElement = createElement("div", null, "Error");
		const bucket = compileRoutes(createElement(Route, { path: "fragile", element: "Throws", errorElement }));

		const routes = bucket.static.get("fragile")!;
		expect(routes[0].errorElement).toBe(errorElement);
	});

	it("Should preserve children in the compiled route", () => {
		const childElement = createElement(Route, { path: "nested", element: "Nested" });
		const bucket = compileRoutes(createElement(Route, { path: "parent" }, childElement));

		const routes = bucket.static.get("parent")!;
		expect(routes[0].children).toBe(childElement);
	});

	it("Should preserve path in the compiled route", () => {
		const bucket = compileRoutes(createElement(Route, { path: "users/:id", element: "Profile" }));

		const routes = bucket.static.get("users")!;
		expect(routes[0].path).toBe("users/:id");
	});

	it("Should preserve path as undefined When route has no path", () => {
		const bucket = compileRoutes(createElement(Route, { element: "Layout" }));

		expect(bucket.empty[0].path).toBeUndefined();
	});

	it("Should preserve path as undefined When route is an index route", () => {
		const bucket = compileRoutes(createElement(Route, { index: true, element: "Home" }));

		expect(bucket.empty[0].path).toBeUndefined();
	});

	it("Should preserve handle in the compiled route", () => {
		const handle = { crumb: "Users", analytics: "users_page" };
		const bucket = compileRoutes(createElement(Route, { path: "users", element: "Users", handle }));

		const routes = bucket.static.get("users")!;
		expect(routes[0].handle).toBe(handle);
	});

	it("Should preserve handle as undefined When route has no handle", () => {
		const bucket = compileRoutes(createElement(Route, { path: "users", element: "Users" }));

		const routes = bucket.static.get("users")!;
		expect(routes[0].handle).toBeUndefined();
	});

	it("Should skip non-Route elements during compilation", () => {
		const bucket = compileRoutes([createElement("div", null, "Not a Route"), createElement(Route, { path: "valid", element: "Valid" })]);

		expect(bucket.static.size).toBe(1);
		expect(bucket.static.get("valid")).toHaveLength(1);
	});

	it("Should skip non-element children (strings and numbers) during compilation", () => {
		const bucket = compileRoutes(["plain text", 42, createElement(Route, { path: "valid", element: "Valid" })]);

		expect(bucket.static.size).toBe(1);
		expect(bucket.static.get("valid")).toHaveLength(1);
		expect(bucket.empty).toHaveLength(0);
		expect(bucket.dynamic).toHaveLength(0);
		expect(bucket.wildcard).toHaveLength(0);
		expect(bucket.absolute).toHaveLength(0);
	});

	it("Should calculate specificity correctly for various segment combinations", () => {
		const allStatic = compileRoutes(createElement(Route, { path: "a/b/c", element: "X" }));
		const mixed = compileRoutes(createElement(Route, { path: "a/:b/c", element: "X" }));
		const allDynamic = compileRoutes(createElement(Route, { path: ":a/:b/:c", element: "X" }));

		expect(allStatic.static.get("a")![0].specificity).toBe(9);
		expect(mixed.static.get("a")![0].specificity).toBe(8);
		expect(allDynamic.dynamic[0].specificity).toBe(6);
	});

	it("Should warn When two routes have the exact same path", () => {
		compileRoutes([createElement(Route, { path: "users", element: "First" }), createElement(Route, { path: "users", element: "Second" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Duplicate route "users" detected'));
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("order #0) wins"));
	});

	it("Should warn When two routes have the same path with trailing slash normalization", () => {
		compileRoutes([createElement(Route, { path: "users/", element: "First" }), createElement(Route, { path: "users", element: "Second" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("users"));
	});

	it("Should not warn When routes have different paths", () => {
		compileRoutes([createElement(Route, { path: "users", element: "Users" }), createElement(Route, { path: "about", element: "About" })]);

		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("Should warn When two index routes are defined", () => {
		compileRoutes([createElement(Route, { index: true, element: "First" }), createElement(Route, { index: true, element: "Second" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<index>"));
	});

	it("Should warn When two pathless layout routes are defined", () => {
		compileRoutes([createElement(Route, { element: "FirstLayout" }), createElement(Route, { element: "SecondLayout" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<layout>"));
	});

	it("Should warn When pathless layout and explicit empty string path are combined", () => {
		compileRoutes([createElement(Route, { element: "Layout" }), createElement(Route, { path: "", element: "OtherLayout" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<layout>"));
	});

	it("Should warn When two absolute routes have the same path", () => {
		compileRoutes([
			createElement(Route, { path: "/admin", element: "First" }),
			createElement(Route, { path: "/admin", element: "Second" }),
		]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("/admin"));
	});

	it("Should warn When two dynamic routes have the same pattern", () => {
		compileRoutes([createElement(Route, { path: ":id", element: "First" }), createElement(Route, { path: ":id", element: "Second" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(":id"));
	});

	it("Should warn When two wildcard routes are defined", () => {
		compileRoutes([createElement(Route, { path: "*", element: "First" }), createElement(Route, { path: "*", element: "Second" })]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("*"));
	});

	it("Should not warn When a static route and a pathless layout coexist", () => {
		compileRoutes([createElement(Route, { path: "users", element: "Users" }), createElement(Route, { element: "Layout" })]);

		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("Should not warn When an index route and a pathless layout coexist", () => {
		compileRoutes([createElement(Route, { index: true, element: "Home" }), createElement(Route, { element: "Layout" })]);

		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("Should warn only for the second occurrence When three routes share the same path", () => {
		compileRoutes([
			createElement(Route, { path: "dup", element: "First" }),
			createElement(Route, { path: "dup", element: "Second" }),
			createElement(Route, { path: "dup", element: "Third" }),
		]);

		expect(warnSpy).toHaveBeenCalledTimes(2);
		expect(warnSpy).toHaveBeenNthCalledWith(1, expect.stringContaining("order #0) wins"));
		expect(warnSpy).toHaveBeenNthCalledWith(2, expect.stringContaining("order #0) wins"));
	});

	it("Should warn When a Route has no path, index, element, or children", () => {
		compileRoutes(createElement(Route, {}));

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("without `path`, `index`, `element`, or `children`"));
	});

	it("Should warn When a Route has a path but no element and no children", () => {
		compileRoutes(createElement(Route, { path: "orphan" }));

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"orphan"'));
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("will render nothing"));
	});

	it("Should warn When a Route has a path and an errorElement but no element or children", () => {
		compileRoutes(createElement(Route, { path: "fragile", errorElement: "Oops" }));

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("will render nothing"));
	});

	it("Should warn When a Route has index but no element and no children", () => {
		compileRoutes(createElement(Route, { index: true }));

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("index"));
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("will render nothing"));
	});

	it("Should not warn When a Route has element but no path, index, or children", () => {
		compileRoutes(createElement(Route, { element: "Standalone" }));

		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("Should not warn When a Route has path, element, and children", () => {
		const childElement = createElement(Route, { path: "nested", element: "Nested" });
		compileRoutes(createElement(Route, { path: "parent", element: "Layout" }, childElement));

		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("Should report the correct first definition order When duplicate is not the immediate next route", () => {
		compileRoutes([
			createElement(Route, { path: "users", element: "First" }),
			createElement(Route, { path: "about", element: "About" }),
			createElement(Route, { path: "users", element: "Second" }),
		]);

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("order #0) wins"));
	});
});
