import { render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { render } from "../../test-utils";
import { useInRouterContext } from "./useInRouterContext";

let hookResult: boolean | null = null;

const TestHarness = () => {
	hookResult = useInRouterContext();
	return null;
};

describe("useInRouterContext", () => {
	beforeEach(() => {
		hookResult = null;
	});

	it("Should return true When rendered inside a Router (via render helper)", () => {
		render(<TestHarness />);

		expect(hookResult).toBe(true);
	});

	it("Should return false When rendered outside any Router (no provider)", () => {
		rtlRender(<TestHarness />);

		expect(hookResult).toBe(false);
	});
});
