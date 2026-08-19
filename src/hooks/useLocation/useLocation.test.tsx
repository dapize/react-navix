import { render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { render } from "../../test-utils";
import { useLocation } from "./useLocation";

let hookResult: ReturnType<typeof useLocation> | null = null;

const TestHarness = () => {
	hookResult = useLocation();
	return null;
};

describe("useLocation", () => {
	beforeEach(() => {
		hookResult = null;
	});

	it("Should return the current location from the store", () => {
		render(<TestHarness />, { location: { pathname: "/users", search: "", hash: "" } });

		expect(hookResult).toEqual({ pathname: "/users", search: "", hash: "" });
	});

	it("Should throw When used outside a Router (no provider)", () => {
		expect(() => {
			rtlRender(<TestHarness />);
		}).toThrow("useLocation() must be used within a Router component.");
	});

	it("Should return state from the store When location has state", () => {
		render(<TestHarness />, {
			location: { pathname: "/users", search: "", hash: "", state: { from: "/login" } },
		});

		expect(hookResult!.state).toEqual({ from: "/login" });
	});

	it("Should return undefined state When location has no state", () => {
		render(<TestHarness />, { location: { pathname: "/users", search: "", hash: "" } });

		expect(hookResult!.state).toBeUndefined();
	});
});
