import { describe, expect, it } from "vitest";

import { getRouteResolutionBase } from "./getRouteResolutionBase";

describe("getRouteResolutionBase", () => {
	it("Should return consumed unchanged When params has no splat", () => {
		const result = getRouteResolutionBase("/users/42", { id: "42" });

		expect(result).toBe("/users/42");
	});

	it("Should return consumed unchanged When params is empty", () => {
		const result = getRouteResolutionBase("/users", {});

		expect(result).toBe("/users");
	});

	it("Should return the static prefix When splat captured one segment", () => {
		const result = getRouteResolutionBase("/files/cat.jpg", { "*": "cat.jpg" });

		expect(result).toBe("/files");
	});

	it("Should return the static prefix When splat captured multiple segments", () => {
		const result = getRouteResolutionBase("/files/a/b/c", { "*": "a/b/c" });

		expect(result).toBe("/files");
	});

	it("Should return consumed When splat is empty string", () => {
		const result = getRouteResolutionBase("/files", { "*": "" });

		expect(result).toBe("/files");
	});

	it("Should return '/' When consumed is '/' with empty splat", () => {
		const result = getRouteResolutionBase("/", { "*": "" });

		expect(result).toBe("/");
	});

	it("Should return '/' When consumed is root and splat captured something", () => {
		const result = getRouteResolutionBase("/stuff", { "*": "stuff" });

		expect(result).toBe("/");
	});

	it("Should handle params with both dynamic segments and splat", () => {
		const result = getRouteResolutionBase("/org/7/files/report.pdf", {
			orgId: "7",
			"*": "report.pdf",
		});

		expect(result).toBe("/org/7/files");
	});
});
