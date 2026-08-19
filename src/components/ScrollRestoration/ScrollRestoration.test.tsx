import { render as rtlRender } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createLocationStore } from "@stores/location";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { NavigatorContext } from "@contexts/NavigatorContext";
import { RoutesContext } from "@contexts/RoutesContext";
import { act, render } from "../../test-utils";
import { Navigate } from "../Navigate";
import { ScrollRestoration } from "./ScrollRestoration";

describe("ScrollRestoration", () => {
	it("Should scroll to top When location.pathname changes", () => {
		const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		const { store } = render(<ScrollRestoration />, {
			location: { pathname: "/home", search: "", hash: "" },
		});

		expect(scrollToSpy).toHaveBeenCalledTimes(1);
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "instant" });

		act(() => {
			store.setLocation({ pathname: "/about", search: "", hash: "" });
		});

		expect(scrollToSpy).toHaveBeenCalledTimes(2);

		scrollToSpy.mockRestore();
	});

	it("Should not scroll When location.pathname stays the same", () => {
		const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		const { store } = render(<ScrollRestoration />, {
			location: { pathname: "/about", search: "", hash: "" },
		});

		expect(scrollToSpy).toHaveBeenCalledTimes(1);

		act(() => {
			store.setLocation({ pathname: "/about", search: "?q=1", hash: "#section" });
		});

		expect(scrollToSpy).toHaveBeenCalledTimes(1);

		scrollToSpy.mockRestore();
	});

	it("Should not crash When window.scrollTo is undefined (SSR)", () => {
		const originalScrollTo = window.scrollTo;
		// @ts-expect-error -- simulating SSR environment where scrollTo may be absent
		delete window.scrollTo;

		expect(() => {
			render(<ScrollRestoration />, {
				location: { pathname: "/ssr", search: "", hash: "" },
			});
		}).not.toThrow();

		window.scrollTo = originalScrollTo;
	});

	it("Should set history.scrollRestoration to 'manual' on mount", () => {
		const def = { value: "auto" as const, configurable: true, writable: true };
		Object.defineProperty(window.history, "scrollRestoration", def);

		const { unmount } = render(<ScrollRestoration />, {
			location: { pathname: "/home", search: "", hash: "" },
		});

		expect(window.history.scrollRestoration).toBe("manual");

		unmount();

		expect(window.history.scrollRestoration).toBe("auto");
		delete (window.history as unknown as Record<string, unknown>).scrollRestoration;
	});

	it("Should not crash When history.scrollRestoration does not exist (SSR)", () => {
		const originalDescriptor = Object.getOwnPropertyDescriptor(window.history, "scrollRestoration");
		delete (window.history as unknown as Record<string, unknown>).scrollRestoration;

		expect(() => {
			render(<ScrollRestoration />, {
				location: { pathname: "/ssr", search: "", hash: "" },
			});
		}).not.toThrow();

		if (originalDescriptor) {
			Object.defineProperty(window.history, "scrollRestoration", originalDescriptor);
		}
	});

	it("Should scroll to top When <Navigate> causes a pathname change", () => {
		const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
		const store = createLocationStore({ pathname: "/", search: "", hash: "" }, "");

		const navigate = (to: string | number) => {
			store.setLocation({ pathname: String(to), search: "", hash: "" });
		};

		rtlRender(
			<LocationStoreContext.Provider value={store}>
				<NavigatorContext.Provider value={navigate}>
					<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
						<div>
							<ScrollRestoration />
							<Navigate to="/dashboard" />
						</div>
					</RoutesContext.Provider>
				</NavigatorContext.Provider>
			</LocationStoreContext.Provider>,
		);

		expect(scrollToSpy).toHaveBeenCalledTimes(2);
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "instant" });

		scrollToSpy.mockRestore();
	});

	it("Should pass behavior 'instant' on every scroll When pathname changes repeatedly", () => {
		const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		const { store } = render(<ScrollRestoration />, {
			location: { pathname: "/first", search: "", hash: "" },
		});

		expect(scrollToSpy).toHaveBeenNthCalledWith(1, { top: 0, behavior: "instant" });

		act(() => {
			store.setLocation({ pathname: "/second", search: "", hash: "" });
		});

		expect(scrollToSpy).toHaveBeenNthCalledWith(2, { top: 0, behavior: "instant" });

		scrollToSpy.mockRestore();
	});
});
