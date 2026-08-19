import { describe, expect, it } from "vitest";

import { matchPath } from "./matchPath";

describe("matchPath", () => {
	it("Should match exact paths", () => {
		const result = matchPath("users", "users");
		expect(result).toEqual({ params: {}, consumed: "/users", pathnameBase: "/users" });
	});

	it("Should match prefix (nested route support)", () => {
		const result = matchPath("users", "users/123");
		expect(result).toEqual({ params: {}, consumed: "/users", pathnameBase: "/users" });
	});

	it("Should not match When pattern is longer than pathname", () => {
		expect(matchPath("users/123/settings", "users/123")).toBeNull();
	});

	it("Should not match different segments", () => {
		expect(matchPath("about", "users")).toBeNull();
	});

	it("Should capture dynamic params", () => {
		const result = matchPath("users/:id", "users/123");
		expect(result).toEqual({ params: { id: "123" }, consumed: "/users/123", pathnameBase: "/users/123" });
	});

	it("Should capture multiple dynamic params", () => {
		const result = matchPath("users/:id/posts/:postId", "users/123/posts/456");
		expect(result).toEqual({
			params: { id: "123", postId: "456" },
			consumed: "/users/123/posts/456",
			pathnameBase: "/users/123/posts/456",
		});
	});

	it("Should match prefix with dynamic params", () => {
		const result = matchPath("users/:id", "users/123/settings");
		expect(result).toEqual({
			params: { id: "123" },
			consumed: "/users/123",
			pathnameBase: "/users/123",
		});
	});

	it("Should match wildcard at end", () => {
		const result = matchPath("*", "anything/at/all");
		expect(result).toEqual({
			params: { "*": "anything/at/all" },
			consumed: "/anything/at/all",
			pathnameBase: "/",
		});
	});

	it("Should match wildcard with prefix", () => {
		const result = matchPath("docs/*", "docs/api/v2/endpoints");
		expect(result).toEqual({
			params: { "*": "api/v2/endpoints" },
			consumed: "/docs/api/v2/endpoints",
			pathnameBase: "/docs",
		});
	});

	it("Should not match When pattern without wildcard is longer than pathname", () => {
		expect(matchPath("users/:id/posts", "users/123")).toBeNull();
	});

	it("Should match root path", () => {
		const result = matchPath("", "");
		expect(result).toEqual({ params: {}, consumed: "/", pathnameBase: "/" });
	});

	it("Should match empty pattern against any pathname", () => {
		const result = matchPath("", "/dashboard");
		expect(result).toEqual({ params: {}, consumed: "/", pathnameBase: "/" });
	});

	it("Should match wildcard with empty capture When pathname equals prefix", () => {
		const result = matchPath("users/*", "users");
		expect(result).toEqual({ params: { "*": "" }, consumed: "/users", pathnameBase: "/users" });
	});

	it("Should handle actual pathname with leading slash", () => {
		const result = matchPath("users/:id", "/users/123");
		expect(result).toEqual({ params: { id: "123" }, consumed: "/users/123", pathnameBase: "/users/123" });
	});

	it("Should compute correct consumed for partial match", () => {
		const result = matchPath("users/:id", "users/123/posts/456");
		expect(result).toEqual({
			params: { id: "123" },
			consumed: "/users/123",
			pathnameBase: "/users/123",
		});
	});

	it("Should not match When wildcard is not the last segment", () => {
		expect(matchPath("users/*/settings", "users/123/settings")).toBeNull();
	});

	it("Should match wildcard at end of combined basePath+pattern against shorter pathname (nested splat scenario)", () => {
		const result = matchPath("explorador/imagenes/gato.jpg/*", "explorador/imagenes/gato.jpg");
		expect(result).toEqual({
			params: { "*": "" },
			consumed: "/explorador/imagenes/gato.jpg",
			pathnameBase: "/explorador/imagenes/gato.jpg",
		});
	});

	it("Should match wildcard at end of combined basePath+pattern and capture remaining segments", () => {
		const result = matchPath("explorador/imagenes/*", "explorador/imagenes/gato.jpg");
		expect(result).toEqual({
			params: { "*": "gato.jpg" },
			consumed: "/explorador/imagenes/gato.jpg",
			pathnameBase: "/explorador/imagenes",
		});
	});

	it("Should not match combined pattern When static segments differ from pathname", () => {
		expect(matchPath("explorador/documentos/*", "explorador/imagenes/gato.jpg")).toBeNull();
	});

	it("Should match a literal route pattern with ñ When pathname contains ñ", () => {
		const result = matchPath("niño", "/niño");
		expect(result).toEqual({ params: {}, consumed: "/niño", pathnameBase: "/niño" });
	});

	it("Should capture decoded ñ in dynamic param When :slug matches a non-ASCII pathname segment", () => {
		const result = matchPath(":slug", "/niño");
		expect(result).toEqual({ params: { slug: "niño" }, consumed: "/niño", pathnameBase: "/niño" });
	});

	it("Should capture decoded emoji in dynamic param When :slug matches a pathname with 🚀", () => {
		const result = matchPath(":emoji", "/rocket🚀");
		expect(result).toEqual({ params: { emoji: "rocket🚀" }, consumed: "/rocket🚀", pathnameBase: "/rocket🚀" });
	});

	it("Should prefix-match a literal route pattern with ñ When pathname has extra segments", () => {
		const result = matchPath("café", "/café/leche");
		expect(result).toEqual({ params: {}, consumed: "/café", pathnameBase: "/café" });
	});

	it("Should capture decoded ñ in dynamic param When :slug is part of a multi-segment pattern with non-ASCII value", () => {
		const result = matchPath("productos/:slug", "/productos/café");
		expect(result).toEqual({ params: { slug: "café" }, consumed: "/productos/café", pathnameBase: "/productos/café" });
	});

	it("Should return null When exact is true and pattern does not consume the whole pathname", () => {
		expect(matchPath("users", "users/123", { exact: true })).toBeNull();
	});

	it("Should match the whole pathname When exact is true", () => {
		const result = matchPath("users/:id", "users/123", { exact: true });
		expect(result).toEqual({ params: { id: "123" }, consumed: "/users/123", pathnameBase: "/users/123" });
	});

	it("Should treat end as an alias for exact", () => {
		expect(matchPath("users", "users/123", { end: true })).toBeNull();
		expect(matchPath("users/:id", "users/123", { end: true })).toEqual({
			params: { id: "123" },
			consumed: "/users/123",
			pathnameBase: "/users/123",
		});
	});

	it("Should give exact precedence over end When both are provided", () => {
		expect(matchPath("users", "users/123", { exact: false, end: true })).toEqual({
			params: {},
			consumed: "/users",
			pathnameBase: "/users",
		});
		expect(matchPath("users", "users/123", { exact: true, end: false })).toBeNull();
	});

	it("Should match wildcard with exact When wildcard consumes the remaining segments", () => {
		const result = matchPath("docs/*", "docs/api/v2", { exact: true });
		expect(result).toEqual({ params: { "*": "api/v2" }, consumed: "/docs/api/v2", pathnameBase: "/docs" });
	});
});
