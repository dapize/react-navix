import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import type { RouteProps } from "../../../Route";
import { compileRoutes, type RouteBucket } from "../compile";
import { matchRoute } from "./match";

const Route = (props: RouteProps): ReactNode => createElement("route", props);

describe("matchRoute", () => {
	const compile = (element: ReactNode): RouteBucket => compileRoutes(element);

	it("Should match an exact static route", () => {
		const bucket = compile(createElement(Route, { path: "users", element: "Users" }));
		const result = matchRoute("/users", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.consumed).toBe("/users");
		expect(result!.params).toEqual({});
		expect(result!.route.element).toBe("Users");
	});

	it("Should return null When static segment differs from pathname", () => {
		const bucket = compile(createElement(Route, { path: "about", element: "About" }));
		const result = matchRoute("/users", bucket, "");

		expect(result).toBeNull();
	});

	it("Should match a prefix When pathname extends beyond pattern (layout route with children)", () => {
		const layout = createElement(
			Route,
			{ path: "users", element: "UsersLayout" },
			createElement(Route, { index: true, element: "Dashboard" }),
		);
		const bucket = compile(layout);
		const result = matchRoute("/users/123", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.consumed).toBe("/users");
		expect(result!.params).toEqual({});
	});

	it("Should capture a dynamic param", () => {
		const bucket = compile(createElement(Route, { path: "users/:id", element: "Detail" }));
		const result = matchRoute("/users/42", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ id: "42" });
		expect(result!.consumed).toBe("/users/42");
	});

	it("Should capture multiple dynamic params", () => {
		const bucket = compile(createElement(Route, { path: "org/:orgId/team/:teamId", element: "Team" }));
		const result = matchRoute("/org/7/team/3", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ orgId: "7", teamId: "3" });
		expect(result!.consumed).toBe("/org/7/team/3");
	});

	it("Should match prefix with dynamic params (layout route with children)", () => {
		const layout = createElement(Route, { path: "users/:id", element: "Layout" }, createElement(Route, { index: true, element: "Child" }));
		const bucket = compile(layout);
		const result = matchRoute("/users/42/settings", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ id: "42" });
		expect(result!.consumed).toBe("/users/42");
	});

	it("Should match a standalone wildcard and capture all segments", () => {
		const bucket = compile(createElement(Route, { path: "*", element: "NotFound" }));
		const result = matchRoute("/anything/at/all", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ "*": "anything/at/all" });
		expect(result!.consumed).toBe("/anything/at/all");
	});

	it("Should match a wildcard with prefix and capture remaining segments", () => {
		const bucket = compile(createElement(Route, { path: "docs/*", element: "Docs" }));
		const result = matchRoute("/docs/api/v2/endpoints", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ "*": "api/v2/endpoints" });
		expect(result!.consumed).toBe("/docs/api/v2/endpoints");
	});

	it("Should capture empty string When wildcard matches no extra segments", () => {
		const bucket = compile(createElement(Route, { path: "users/*", element: "Users" }));
		const result = matchRoute("/users", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ "*": "" });
		expect(result!.consumed).toBe("/users");
	});

	it("Should match an index route When pathname equals parent basePath", () => {
		const bucket = compile(createElement(Route, { index: true, element: "Dashboard" }));
		const result = matchRoute("/dashboard", bucket, "/dashboard");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({});
		expect(result!.consumed).toBe("/dashboard");
	});

	it("Should not match an index route When pathname extends beyond parent basePath", () => {
		const bucket = compile(createElement(Route, { index: true, element: "Dashboard" }));
		const result = matchRoute("/dashboard/extra", bucket, "/dashboard");

		expect(result).toBeNull();
	});

	it("Should match an index route at root level", () => {
		const bucket = compile(createElement(Route, { index: true, element: "Home" }));
		const result = matchRoute("/", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.consumed).toBe("/");
	});

	it("Should match a pathless layout route as prefix at current level", () => {
		const layout = createElement(Route, { element: "Layout" }, createElement(Route, { index: true, element: "Child" }));
		const bucket = compile(layout);
		const result = matchRoute("/docs/instalacion", bucket, "/docs");

		expect(result).not.toBeNull();
		expect(result!.consumed).toBe("/docs");
		expect(result!.params).toEqual({});
	});

	it("Should match a pathless layout route at root level", () => {
		const layout = createElement(Route, { element: "RootLayout" }, createElement(Route, { index: true, element: "Child" }));
		const bucket = compile(layout);
		const result = matchRoute("/anything", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.consumed).toBe("/");
	});

	it("Should return null When pathname does not start with parent basePath", () => {
		const bucket = compile(createElement(Route, { path: "instalacion", element: "Page" }));
		const result = matchRoute("/other", bucket, "/docs");

		expect(result).toBeNull();
	});

	it("Should handle parent basePath with trailing slash", () => {
		const bucket = compile(createElement(Route, { path: "instalacion", element: "Page" }));
		const result = matchRoute("/docs/instalacion", bucket, "/docs/");

		expect(result).not.toBeNull();
		expect(result!.consumed).toBe("/docs/instalacion");
	});

	it("Should select the route with highest specificity When multiple routes match", () => {
		const bucket = compile([
			createElement(Route, { path: "users", element: "UsersLayout" }),
			createElement(Route, { path: "users/:id", element: "UserDetail" }),
		]);

		const result = matchRoute("/users/42", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("UserDetail");
	});

	it("Should use definition order as tiebreaker When scores are equal", () => {
		const bucket = compile([
			createElement(Route, { path: "a/:b/c", element: "First" }),
			createElement(Route, { path: "a/b/:c", element: "Second" }),
		]);

		const result = matchRoute("/a/b/c", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("First");
	});

	it("Should match the wildcard catch-all When no static or dynamic route matches (R3)", () => {
		const bucket = compile([
			createElement(Route, { path: "projects/active", element: "Active" }),
			createElement(Route, { path: "*", element: "NotFound" }),
		]);

		const result = matchRoute("/projects/archived", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("NotFound");
	});

	it("Should evaluate all buckets and pick highest score When dynamic candidate exists (R2)", () => {
		const bucket = compile([
			createElement(Route, { path: "users/:id", element: "UserDetail" }),
			createElement(Route, { path: ":section/settings", element: "Settings" }),
		]);

		const result = matchRoute("/users/settings", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("UserDetail");
	});

	it("Should match absolute path route regardless of parent basePath", () => {
		const bucket = compile([
			createElement(Route, { path: "/admin", element: "Admin" }),
			createElement(Route, { path: "dashboard", element: "Dashboard" }),
		]);

		const result = matchRoute("/admin", bucket, "/other-context");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("Admin");
		expect(result!.consumed).toBe("/admin");
	});

	it("Should match absolute path route with dynamic segments", () => {
		const bucket = compile(createElement(Route, { path: "/admin/:section", element: "AdminSection" }));

		const result = matchRoute("/admin/users", bucket, "/ignored");

		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ section: "users" });
		expect(result!.consumed).toBe("/admin/users");
	});

	it("Should rank multiple absolute candidates by specificity When parent basePath diverges", () => {
		const bucket = compile([
			createElement(Route, { path: "/a/b", element: "StaticAB" }),
			createElement(Route, { path: "/a/:c", element: "DynamicAC" }),
		]);

		const result = matchRoute("/a/b", bucket, "/other");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("StaticAB");
	});

	it("Should use definition order as tiebreaker When absolute candidates diverge from parent basePath with equal specificity", () => {
		const bucket = compile([
			createElement(Route, { path: "/:x/b", element: "First" }),
			createElement(Route, { path: "/a/:y", element: "Second" }),
		]);

		const result = matchRoute("/a/b", bucket, "/other");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("First");
	});

	it("Should work correctly When all routes share the same first segment (R4 degradation)", () => {
		const bucket = compile([
			createElement(Route, { path: "docs", element: "Index" }),
			createElement(Route, { path: "docs/instalacion", element: "Instalacion" }),
			createElement(Route, { path: "docs/hooks", element: "Hooks" }),
			createElement(Route, { path: "docs/rutas", element: "Rutas" }),
		]);

		const result = matchRoute("/docs/rutas", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("Rutas");
	});

	it("Should handle nested wildcard scenario When parent consumes full pathname (R6)", () => {
		const bucket = compile(createElement(Route, { path: "explorador/*", element: "ExploradorLayout" }));

		const parentResult = matchRoute("/explorador/imagenes/gato.jpg", bucket, "");

		expect(parentResult).not.toBeNull();
		expect(parentResult!.params).toEqual({ "*": "imagenes/gato.jpg" });
		expect(parentResult!.consumed).toBe("/explorador/imagenes/gato.jpg");

		const childBucket = compile(createElement(Route, { path: "*", element: "Archivo" }));
		const childResult = matchRoute("/explorador/imagenes/gato.jpg", childBucket, "/explorador");

		expect(childResult).not.toBeNull();
		expect(childResult!.params).toEqual({ "*": "imagenes/gato.jpg" });
		expect(childResult!.consumed).toBe("/explorador/imagenes/gato.jpg");
	});

	it("Should handle nested wildcard When pathname equals wildcard prefix exactly", () => {
		const parentBucket = compile(createElement(Route, { path: "explorador/*", element: "Layout" }));
		const parentResult = matchRoute("/explorador", parentBucket, "");

		expect(parentResult).not.toBeNull();
		expect(parentResult!.params).toEqual({ "*": "" });
		expect(parentResult!.consumed).toBe("/explorador");

		const childBucket = compile(createElement(Route, { path: "*", element: "RootDir" }));
		const childResult = matchRoute("/explorador", childBucket, "/explorador");

		expect(childResult).not.toBeNull();
		expect(childResult!.params).toEqual({ "*": "" });
		expect(childResult!.consumed).toBe("/explorador");
	});

	it("Should return null When pattern without wildcard is longer than remaining pathname", () => {
		const bucket = compile(createElement(Route, { path: "users/settings", element: "Settings" }));
		const result = matchRoute("/users", bucket, "");

		expect(result).toBeNull();
	});

	it("Should return null When wildcard is not the last segment", () => {
		const bucket = compile(createElement(Route, { path: "users/*/settings", element: "Invalid" }));
		const result = matchRoute("/users/123/settings", bucket, "");

		expect(result).toBeNull();
	});

	it("Should handle pathname with leading slash consistently", () => {
		const bucket = compile(createElement(Route, { path: "users/:id", element: "Detail" }));
		const withSlash = matchRoute("/users/42", bucket, "");
		const withoutSlash = matchRoute("users/42", bucket, "");

		expect(withSlash).not.toBeNull();
		expect(withoutSlash).not.toBeNull();
		expect(withSlash!.params).toEqual(withoutSlash!.params);
		expect(withSlash!.consumed).toBe("/users/42");
		expect(withoutSlash!.consumed).toBe("/users/42");
	});

	it("Should select index route over wildcard When both match with equal score", () => {
		const bucket = compile([
			createElement(Route, { index: true, element: "Home" }),
			createElement(Route, { path: "*", element: "NotFound" }),
		]);

		const result = matchRoute("/", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("Home");
	});

	it("Should select wildcard over index When wildcard defined first and scores equal", () => {
		const bucket = compile([
			createElement(Route, { path: "*", element: "NotFound" }),
			createElement(Route, { index: true, element: "Home" }),
		]);

		const result = matchRoute("/", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("NotFound");
	});

	it("Should select dynamic route over wildcard due to higher specificity", () => {
		const bucket = compile([
			createElement(Route, { path: "*", element: "NotFound" }),
			createElement(Route, { path: ":slug", element: "SlugPage" }),
		]);

		const result = matchRoute("/mi-post", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("SlugPage");
	});

	it("Should handle multiple dynamic candidates With different segment counts", () => {
		const bucket = compile([
			createElement(Route, { path: ":section", element: "Section" }),
			createElement(Route, { path: ":section/:subsection", element: "SubSection" }),
		]);

		const result = matchRoute("/docs/api", bucket, "");

		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("SubSection");
	});

	it("Should return null When bucket is empty", () => {
		const bucket = compile(null);
		const result = matchRoute("/anything", bucket, "");

		expect(result).toBeNull();
	});
});

describe("compileRoutes + matchRoute integration scenarios", () => {
	it("Should resolve blog layout with index and dynamic slug (demo C2)", () => {
		const bucket = compileRoutes(
			createElement(
				Route,
				{ path: "blog", element: "BlogLayout" },
				createElement(Route, { index: true, element: "BlogPage" }),
				createElement(Route, { path: ":slug", element: "SinglePost" }),
			),
		);

		const parentMatch = matchRoute("/blog", bucket, "");
		expect(parentMatch).not.toBeNull();
		expect(parentMatch!.route.element).toBe("BlogLayout");
		expect(parentMatch!.consumed).toBe("/blog");

		const blogBucket = compileRoutes(parentMatch!.route.children);
		const indexMatch = matchRoute("/blog", blogBucket, "/blog");
		expect(indexMatch).not.toBeNull();
		expect(indexMatch!.route.element).toBe("BlogPage");

		const slugMatch = matchRoute("/blog/mi-post", blogBucket, "/blog");
		expect(slugMatch).not.toBeNull();
		expect(slugMatch!.route.element).toBe("SinglePost");
		expect(slugMatch!.params).toEqual({ slug: "mi-post" });
	});

	it("Should resolve 3-level deep nesting (demo C4)", () => {
		const level1 = compileRoutes(
			createElement(
				Route,
				{ path: "profundo", element: "DeepRootLayout" },
				createElement(
					Route,
					{ path: "nivel1", element: "DeepMidLayout" },
					createElement(Route, { path: "nivel2", element: "DeepLeafPage" }),
				),
			),
		);

		const l1Match = matchRoute("/profundo/nivel1/nivel2", level1, "");
		expect(l1Match).not.toBeNull();
		expect(l1Match!.consumed).toBe("/profundo");

		const level2 = compileRoutes(l1Match!.route.children);
		const l2Match = matchRoute("/profundo/nivel1/nivel2", level2, "/profundo");
		expect(l2Match).not.toBeNull();
		expect(l2Match!.consumed).toBe("/profundo/nivel1");

		const level3 = compileRoutes(l2Match!.route.children);
		const l3Match = matchRoute("/profundo/nivel1/nivel2", level3, "/profundo/nivel1");
		expect(l3Match).not.toBeNull();
		expect(l3Match!.route.element).toBe("DeepLeafPage");
		expect(l3Match!.consumed).toBe("/profundo/nivel1/nivel2");
	});

	it("Should resolve layout without element (demo C5)", () => {
		const bucket = compileRoutes(
			createElement(
				Route,
				{ path: "navlink-test" },
				createElement(Route, { index: true, element: "NavLinkMergeTestPage" }),
				createElement(Route, { path: "other", element: "OtherPage" }),
			),
		);

		const parentMatch = matchRoute("/navlink-test", bucket, "");
		expect(parentMatch).not.toBeNull();
		expect(parentMatch!.route.element).toBeNull();

		const childBucket = compileRoutes(parentMatch!.route.children);
		const childMatch = matchRoute("/navlink-test", childBucket, "/navlink-test");
		expect(childMatch).not.toBeNull();
		expect(childMatch!.route.element).toBe("NavLinkMergeTestPage");
	});

	it("Should resolve large same-prefix group (demo C7)", () => {
		const bucket = compileRoutes(
			createElement(
				Route,
				{ path: "docs" },
				createElement(Route, { index: true, element: "InicioRapido" }),
				createElement(Route, { path: "instalacion", element: "Instalacion" }),
				createElement(Route, { path: "browserrouter", element: "BrowserRouter" }),
				createElement(Route, { path: "hashrouter", element: "HashRouter" }),
				createElement(Route, { path: "memoryrouter", element: "MemoryRouter" }),
				createElement(Route, { path: "rutas", element: "Rutas" }),
				createElement(Route, { path: "navegacion", element: "Navegacion" }),
				createElement(Route, { path: "hooks", element: "Hooks" }),
				createElement(Route, { path: "scroll", element: "Scroll" }),
				createElement(Route, { path: "proteccion", element: "Proteccion" }),
				createElement(Route, { path: "utilidades", element: "Utilidades" }),
				createElement(Route, { path: "typescript", element: "TypeScript" }),
				createElement(Route, { path: "error-boundaries", element: "ErrorBoundaries" }),
			),
		);

		const docsEntry = bucket.static.get("docs");
		expect(docsEntry).toBeDefined();
		expect(docsEntry).toHaveLength(1);

		const parentMatch = matchRoute("/docs", bucket, "");
		expect(parentMatch).not.toBeNull();

		const childBucket = compileRoutes(parentMatch!.route.children);
		expect(childBucket.empty.length + childBucket.static.size).toBe(13);

		const indexMatch = matchRoute("/docs", childBucket, "/docs");
		expect(indexMatch).not.toBeNull();
		expect(indexMatch!.route.element).toBe("InicioRapido");

		const hookMatch = matchRoute("/docs/hooks", childBucket, "/docs");
		expect(hookMatch).not.toBeNull();
		expect(hookMatch!.route.element).toBe("Hooks");
	});

	it("Should resolve error boundary route preserving errorElement (demo C8)", () => {
		const errorFallback = createElement("div", null, "Error Fallback");
		const bucket = compileRoutes(
			createElement(Route, { path: "error-boundary/counter", element: "ErrorCounter", errorElement: errorFallback }),
		);

		const staticRoutes = bucket.static.get("error-boundary");
		expect(staticRoutes).not.toBeNull();
		expect(staticRoutes![0].errorElement).toBe(errorFallback);

		const result = matchRoute("/error-boundary/counter", bucket, "");
		expect(result).not.toBeNull();
		expect(result!.route.element).toBe("ErrorCounter");
		expect(result!.route.errorElement).toBe(errorFallback);
		expect(result!.consumed).toBe("/error-boundary/counter");
	});

	it("Should resolve catch-all at end of routes (demo C1)", () => {
		const bucket = compileRoutes([
			createElement(Route, { path: "blog", element: "Blog" }),
			createElement(Route, { path: "playground", element: "Playground" }),
			createElement(Route, { path: "*", element: "NotFound" }),
		]);

		const knownResult = matchRoute("/blog", bucket, "");
		expect(knownResult).not.toBeNull();
		expect(knownResult!.route.element).toBe("Blog");

		const unknownResult = matchRoute("/ruta-que-no-existe", bucket, "");
		expect(unknownResult).not.toBeNull();
		expect(unknownResult!.route.element).toBe("NotFound");
	});

	it("Should handle dynamic first segment correctly in matching", () => {
		const bucket = compileRoutes(createElement(Route, { path: ":id", element: "DynamicRoot" }));

		const result = matchRoute("/anything", bucket, "");
		expect(result).not.toBeNull();
		expect(result!.params).toEqual({ id: "anything" });
		expect(result!.consumed).toBe("/anything");
	});

	it("Should return null When leaf route has extra segments beyond its pattern", () => {
		const bucket = compileRoutes(createElement(Route, { path: ":id", element: "DynamicRoot" }));

		const result = matchRoute("/anything/extra", bucket, "");
		expect(result).toBeNull();
	});
});
