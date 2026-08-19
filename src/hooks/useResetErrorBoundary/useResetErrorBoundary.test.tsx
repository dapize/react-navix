import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RouteErrorContext } from "@contexts/RouteErrorContext";
import { useResetErrorBoundary } from "./useResetErrorBoundary";

let capturedReset: (() => void) | null = null;

const TestHarness = () => {
	capturedReset = useResetErrorBoundary();
	return null;
};

describe("useResetErrorBoundary", () => {
	beforeEach(() => {
		capturedReset = null;
	});
	it("Should return the resetErrorBoundary function from context When used inside an errorElement", () => {
		const mockReset = vi.fn();

		render(
			<RouteErrorContext.Provider value={{ error: new Error("test"), resetErrorBoundary: mockReset }}>
				<TestHarness />
			</RouteErrorContext.Provider>,
		);

		expect(capturedReset).toBe(mockReset);
	});

	it("Should throw When used outside a route's errorElement", () => {
		expect(() => {
			render(<TestHarness />);
		}).toThrow("useResetErrorBoundary() must be used within a route's errorElement.");
	});

	it("Should invoke the reset function When the returned function is called", () => {
		const mockReset = vi.fn();

		render(
			<RouteErrorContext.Provider value={{ error: new Error("test"), resetErrorBoundary: mockReset }}>
				<TestHarness />
			</RouteErrorContext.Provider>,
		);

		capturedReset?.();

		expect(mockReset).toHaveBeenCalledOnce();
	});
});
