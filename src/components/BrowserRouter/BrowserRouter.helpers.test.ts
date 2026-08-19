import { beforeEach, describe, expect, it } from "vitest";

import { extractLocationFromPathname } from "./BrowserRouter.helpers";

const mockLocation = {
	pathname: "/",
	search: "",
	hash: "",
};

describe("extractLocationFromPathname", () => {
	beforeEach(() => {
		mockLocation.pathname = "/";
		mockLocation.search = "";
		mockLocation.hash = "";

		Object.defineProperty(window, "location", {
			configurable: true,
			value: mockLocation,
		});

		Object.defineProperty(window.history, "state", {
			configurable: true,
			writable: true,
			value: null,
		});
	});

	it("Should return the decoded pathname When window.location.pathname is percent-encoded", () => {
		mockLocation.pathname = "/ni%C3%B1o";

		const result = extractLocationFromPathname("");

		expect(result.pathname).toBe("/niño");
	});

	it("Should strip the basename When the pathname starts with it", () => {
		mockLocation.pathname = "/app/usuarios";

		const result = extractLocationFromPathname("/app");

		expect(result.pathname).toBe("/usuarios");
	});

	it("Should preserve search and hash", () => {
		mockLocation.pathname = "/dashboard";
		mockLocation.search = "?tab=1";
		mockLocation.hash = "#top";

		const result = extractLocationFromPathname("");

		expect(result.pathname).toBe("/dashboard");
		expect(result.search).toBe("?tab=1");
		expect(result.hash).toBe("#top");
	});

	it("Should not throw and keep the literal '%' When the pathname has a malformed percent sequence", () => {
		mockLocation.pathname = "/productos/50%";

		const result = extractLocationFromPathname("");

		expect(result.pathname).toBe("/productos/50%");
	});
});
