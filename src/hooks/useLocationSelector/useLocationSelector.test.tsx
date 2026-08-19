import { act, render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Location } from "@stores/location";
import { createLocationStore } from "@stores/location";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { render } from "../../test-utils";
import { useLocationSelector } from "./useLocationSelector";

let capturedValue: unknown = null;

const TestHarness = ({ selector }: { selector: (loc: { pathname: string; search: string; hash: string }) => unknown }) => {
	capturedValue = useLocationSelector(selector);
	return null;
};

describe("useLocationSelector", () => {
	beforeEach(() => {
		capturedValue = null;
	});

	it("Should return the selected value from the initial location", () => {
		capturedValue = null;
		render(<TestHarness selector={(loc) => loc.pathname} />, { location: { pathname: "/home", search: "", hash: "" } });

		expect(capturedValue).toBe("/home");
	});

	it("Should return the selected value from a composite selector", () => {
		capturedValue = null;
		render(<TestHarness selector={(loc) => `${loc.pathname}:${loc.search || "-"}`} />, {
			location: { pathname: "/users/42", search: "", hash: "" },
		});

		expect(capturedValue).toBe("/users/42:-");
	});

	it("Should return the same reference across renders When location does not change", () => {
		const selector = vi.fn((loc: { pathname: string }) => loc.pathname);
		const store1 = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");

		capturedValue = null;
		const { rerender } = rtlRender(
			<LocationStoreContext.Provider value={store1}>
				<TestHarness selector={selector} />
			</LocationStoreContext.Provider>,
		);

		const first = capturedValue;
		selector.mockClear();

		const store2 = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		rerender(
			<LocationStoreContext.Provider value={store2}>
				<TestHarness selector={selector} />
			</LocationStoreContext.Provider>,
		);

		expect(capturedValue).toBe(first);
	});

	it("Should update When the selected value changes", () => {
		const selector = (loc: { pathname: string; search: string; hash: string }) => loc.pathname;

		capturedValue = null;
		const { store } = render(<TestHarness selector={selector} />, { location: { pathname: "/home", search: "", hash: "" } });

		act(() => {
			store.setLocation({ pathname: "/about", search: "", hash: "" });
		});

		expect(capturedValue).toBe("/about");
	});

	it("Should not notify When the selected value stays the same", () => {
		const selector = (loc: { pathname: string; search: string; hash: string }) => loc.pathname;

		capturedValue = null;
		const { store } = render(<TestHarness selector={selector} />, { location: { pathname: "/home", search: "", hash: "" } });

		const before = capturedValue;

		act(() => {
			store.setLocation({ pathname: "/home", search: "?q=1", hash: "#top" });
		});

		expect(capturedValue).toBe(before);
	});

	it("Should not notify When unrelated location field changes", () => {
		const selector = (loc: { pathname: string; search: string; hash: string }) => loc.search;

		capturedValue = null;
		const { store } = render(<TestHarness selector={selector} />, { location: { pathname: "/home", search: "", hash: "" } });

		act(() => {
			store.setLocation({ pathname: "/about", search: "", hash: "" });
		});

		expect(capturedValue).toBe("");
	});

	it("Should throw When used outside a Router (no provider)", () => {
		expect(() => {
			rtlRender(<TestHarness selector={(loc) => loc.pathname} />);
		}).toThrow("useLocationSelector() must be used within a Router component.");
	});

	it("Should return value from new selector When selector changes between renders", () => {
		capturedValue = null;
		const { rerender } = render(<TestHarness selector={(loc) => loc.pathname} />, {
			location: { pathname: "/home", search: "", hash: "#top" },
		});

		expect(capturedValue).toBe("/home");

		rerender(<TestHarness selector={(loc) => loc.hash} />);

		expect(capturedValue).toBe("#top");
	});

	it("Should not re-render from store notification When selector swap computes same value for current store", () => {
		const selector = vi.fn((loc: Location) => loc.pathname);

		capturedValue = null;
		const { store, rerender } = render(<TestHarness selector={selector} />, { location: { pathname: "/home", search: "", hash: "" } });

		expect(capturedValue).toBe("/home");
		selector.mockClear();

		rerender(<TestHarness selector={(loc) => loc.pathname} />);

		expect(capturedValue).toBe("/home");

		act(() => {
			store.setLocation({ pathname: "/home", search: "?q=1", hash: "" });
		});

		expect(capturedValue).toBe("/home");
	});

	it("Should update When store changes after selector swap and selected value differs", () => {
		capturedValue = null;
		const { rerender, store } = render(<TestHarness selector={(loc) => loc.pathname} />, {
			location: { pathname: "/home", search: "", hash: "" },
		});

		expect(capturedValue).toBe("/home");

		rerender(<TestHarness selector={(loc) => loc.hash} />);

		expect(capturedValue).toBe("");

		act(() => {
			store.setLocation({ pathname: "/home", search: "", hash: "#section" });
		});

		expect(capturedValue).toBe("#section");
	});

	it("Should not update When store changes after selector swap but selected value stays same", () => {
		capturedValue = null;
		const { rerender, store } = render(<TestHarness selector={(loc) => loc.pathname} />, {
			location: { pathname: "/home", search: "", hash: "" },
		});

		expect(capturedValue).toBe("/home");

		rerender(<TestHarness selector={(loc) => loc.hash} />);

		expect(capturedValue).toBe("");

		act(() => {
			store.setLocation({ pathname: "/about", search: "?q=1", hash: "" });
		});

		expect(capturedValue).toBe("");
	});
});
