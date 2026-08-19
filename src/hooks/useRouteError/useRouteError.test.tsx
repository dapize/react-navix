import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { RouteErrorContext } from "@contexts/RouteErrorContext";
import { useRouteError } from "./useRouteError";

let capturedError: unknown;

const TestHarness = () => {
	capturedError = useRouteError();
	return null;
};

describe("useRouteError", () => {
	beforeEach(() => {
		capturedError = undefined;
	});
	it("Should return the error from context When used inside an errorElement", () => {
		const testError = new Error("test error");

		render(
			<RouteErrorContext.Provider value={{ error: testError, resetErrorBoundary: () => {} }}>
				<TestHarness />
			</RouteErrorContext.Provider>,
		);

		expect(capturedError).toBe(testError);
	});

	it("Should throw When used outside a route's errorElement", () => {
		expect(() => {
			render(<TestHarness />);
		}).toThrow("useRouteError() must be used within a route's errorElement.");
	});
});
