import { render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseTo } from "@helpers/parseTo";
import { type BlockerRegistry, createBlockerRegistry } from "@stores/blockers";
import { createLocationStore } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { LocationStoreContext } from "@contexts/LocationStoreContext";
import { NavigatorContext } from "@contexts/NavigatorContext";
import { RoutesContext } from "@contexts/RoutesContext";
import { Navigate } from "@components/Navigate";
import { act, render } from "../../test-utils";
import type { BlockerContext, BlockerFunction } from "../useResolvedBlocker";
import { useBlocker } from "./useBlocker";
import type { Blocker } from "./useBlocker.types";

let hookResult: Blocker | null = null;
let registry: BlockerRegistry | null = null;

const TestHarness = ({ shouldBlock }: { shouldBlock: BlockerFunction }) => {
	hookResult = useBlocker(shouldBlock);
	return null;
};

const captureRegistry = (data: ReturnType<typeof render>): ReturnType<typeof render> => {
	registry = data.blockerRegistry;
	return data;
};

const makeLoc = (pathname: string, search = "", hash = ""): { pathname: string; search: string; hash: string } => ({
	pathname,
	search,
	hash,
});

describe("useBlocker", () => {
	beforeEach(() => {
		hookResult = null;
		registry = null;
	});

	it("Should throw When used outside a Router (no BlockerRegistryContext)", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const store = createLocationStore({ pathname: "/", search: "", hash: "" }, "");

		expect(() => {
			rtlRender(
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={vi.fn()}>
						<TestHarness shouldBlock={true} />
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>,
			);
		}).toThrow("useBlocker() must be used within a Router component.");

		errorSpy.mockRestore();
	});

	it("Should not block navigation When shouldBlock is false", () => {
		captureRegistry(render(<TestHarness shouldBlock={false} />));

		expect(hookResult!.isBlocking).toBe(false);
	});

	it("Should block navigation When shouldBlock is true", () => {
		captureRegistry(render(<TestHarness shouldBlock={true} />));

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		expect(hookResult!.isBlocking).toBe(true);
	});

	it("Should not call navigate When blocked", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("Should proceed with navigation When proceed is called", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/about?q=1", makeLoc("/about", "?q=1"), undefined, { type: "push" });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith("/about?q=1", undefined);
	});

	it("Should cancel navigation When reset is called", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		act(() => {
			hookResult!.reset();
		});

		expect(navigateMock).not.toHaveBeenCalled();
		expect(hookResult!.isBlocking).toBe(false);
	});

	it("Should store the next location When blocked", () => {
		captureRegistry(render(<TestHarness shouldBlock={true} />));

		act(() => {
			registry!.check("/dashboard?tab=1#section", makeLoc("/dashboard", "?tab=1", "#section"), undefined, { type: "push" });
		});

		expect(hookResult!.nextLocation.pathname).toBe("/dashboard");
		expect(hookResult!.nextLocation.search).toBe("?tab=1");
		expect(hookResult!.nextLocation.hash).toBe("#section");
	});

	it("Should block When shouldBlock is a callback returning true", () => {
		captureRegistry(render(<TestHarness shouldBlock={() => true} />));

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		expect(hookResult!.isBlocking).toBe(true);
	});

	it("Should not block When shouldBlock is a callback returning false", () => {
		captureRegistry(render(<TestHarness shouldBlock={() => false} />));

		expect(hookResult!.isBlocking).toBe(false);
	});

	it("Should auto-unblock When shouldBlock transitions from true to false", () => {
		const { rerender } = captureRegistry(render(<TestHarness shouldBlock={true} />));

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		expect(hookResult!.isBlocking).toBe(true);

		hookResult = null;
		rerender(<TestHarness shouldBlock={false} />);

		expect(hookResult!.isBlocking).toBe(false);
	});

	it("Should proceed with navigation When proceed is called with callback blocker", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={() => true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/dashboard?tab=1", makeLoc("/dashboard", "?tab=1"), undefined, { type: "push" });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith("/dashboard?tab=1", undefined);
	});

	it("Should clear nextLocation When reset is called", () => {
		captureRegistry(render(<TestHarness shouldBlock={true} />));

		act(() => {
			registry!.check("/about?q=1#sec", makeLoc("/about", "?q=1", "#sec"), undefined, { type: "push" });
		});

		expect(hookResult!.nextLocation.pathname).toBe("/about");
		expect(hookResult!.nextLocation.search).toBe("?q=1");
		expect(hookResult!.nextLocation.hash).toBe("#sec");

		act(() => {
			hookResult!.reset();
		});

		expect(hookResult!.nextLocation.pathname).toBe("/");
		expect(hookResult!.nextLocation.search).toBe("");
		expect(hookResult!.nextLocation.hash).toBe("");
	});

	it("Should clear nextLocation When proceed is called", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		expect(hookResult!.nextLocation.pathname).toBe("/about");

		act(() => {
			hookResult!.proceed();
		});

		expect(hookResult!.nextLocation.pathname).toBe("/");
		expect(hookResult!.nextLocation.search).toBe("");
		expect(hookResult!.nextLocation.hash).toBe("");
	});

	it("Should clear nextLocation When shouldBlock transitions from true to false", () => {
		const { rerender } = captureRegistry(render(<TestHarness shouldBlock={true} />));

		act(() => {
			registry!.check("/about", makeLoc("/about"), undefined, { type: "push" });
		});

		expect(hookResult!.nextLocation.pathname).toBe("/about");

		hookResult = null;
		rerender(<TestHarness shouldBlock={false} />);

		expect(hookResult!.nextLocation.pathname).toBe("/");
		expect(hookResult!.nextLocation.search).toBe("");
		expect(hookResult!.nextLocation.hash).toBe("");
	});

	it("Should block <Navigate> When a blocker is active", () => {
		const navigateMock = vi.fn();
		const store = createLocationStore({ pathname: "/", search: "", hash: "" }, "");
		const localRegistry = createBlockerRegistry();
		registry = localRegistry;

		const navigateWithBlockerCheck = (to: string | number, options?: { replace?: boolean; relative?: "route" | "path" }) => {
			const resolvedTo = String(to);
			const blocked = localRegistry.check(resolvedTo, parseTo(resolvedTo), options, {
				type: options?.replace ? "replace" : "push",
			});
			if (blocked) return;
			navigateMock(resolvedTo, options);
		};

		hookResult = null;

		rtlRender(
			<BlockerRegistryContext.Provider value={localRegistry}>
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={navigateWithBlockerCheck}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<div>
								<TestHarness shouldBlock={true} />
								<Navigate to="/about" />
							</div>
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</BlockerRegistryContext.Provider>,
		);

		expect(hookResult!.isBlocking).toBe(true);
		expect(hookResult!.nextLocation.pathname).toBe("/about");
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("Should not re-block navigation When proceed() is called after a block (bypassRef)", () => {
		const navigateMock = vi.fn();
		const store = createLocationStore({ pathname: "/", search: "", hash: "" }, "");
		const localRegistry = createBlockerRegistry();
		registry = localRegistry;

		const navigateWithBlockerCheck = (to: string | number, options?: { replace?: boolean; relative?: "route" | "path" }) => {
			const resolvedTo = String(to);
			const blocked = localRegistry.check(resolvedTo, parseTo(resolvedTo), options, {
				type: options?.replace ? "replace" : "push",
			});
			if (blocked) return;
			navigateMock(resolvedTo, options);
		};

		hookResult = null;

		rtlRender(
			<BlockerRegistryContext.Provider value={localRegistry}>
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={navigateWithBlockerCheck}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<TestHarness shouldBlock={true} />
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</BlockerRegistryContext.Provider>,
		);

		act(() => {
			navigateWithBlockerCheck("/about", { replace: false });
		});

		expect(hookResult!.isBlocking).toBe(true);
		expect(navigateMock).not.toHaveBeenCalled();

		act(() => {
			hookResult!.proceed();
		});

		expect(hookResult!.isBlocking).toBe(false);
		expect(navigateMock).toHaveBeenCalledWith("/about", { replace: false });
	});

	it("Should re-block navigation to the same target after auto-clear cleans the bypass", () => {
		const navigateMock = vi.fn();
		const store = createLocationStore({ pathname: "/", search: "", hash: "" }, "");
		const localRegistry = createBlockerRegistry();
		registry = localRegistry;

		const navigateWithBlockerCheck = (to: string | number, options?: { replace?: boolean; relative?: "route" | "path" }) => {
			const resolvedTo = String(to);
			const blocked = localRegistry.check(resolvedTo, parseTo(resolvedTo), options, {
				type: options?.replace ? "replace" : "push",
			});
			if (blocked) return;
			navigateMock(resolvedTo, options);
		};

		hookResult = null;

		const { rerender } = rtlRender(
			<BlockerRegistryContext.Provider value={localRegistry}>
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={navigateWithBlockerCheck}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<TestHarness shouldBlock={true} />
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</BlockerRegistryContext.Provider>,
		);

		act(() => {
			navigateWithBlockerCheck("/blog");
		});

		expect(hookResult!.isBlocking).toBe(true);

		act(() => {
			hookResult!.proceed();
		});

		expect(hookResult!.isBlocking).toBe(false);

		hookResult = null;
		rerender(
			<BlockerRegistryContext.Provider value={localRegistry}>
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={navigateWithBlockerCheck}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<TestHarness shouldBlock={false} />
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</BlockerRegistryContext.Provider>,
		);

		expect(hookResult!.isBlocking).toBe(false);

		hookResult = null;
		rerender(
			<BlockerRegistryContext.Provider value={localRegistry}>
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={navigateWithBlockerCheck}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<TestHarness shouldBlock={true} />
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</BlockerRegistryContext.Provider>,
		);

		act(() => {
			navigateWithBlockerCheck("/blog");
		});

		expect(hookResult!.isBlocking).toBe(true);
		expect(hookResult!.nextLocation.pathname).toBe("/blog");
	});

	it("Should store state in nextLocation When blocked with state", () => {
		captureRegistry(render(<TestHarness shouldBlock={true} />));

		act(() => {
			registry!.check("/dashboard", { pathname: "/dashboard", search: "", hash: "", state: { from: "/home" } }, undefined, {
				type: "push",
			});
		});

		expect(hookResult!.nextLocation.state).toEqual({ from: "/home" });
	});

	it("Should preserve state in options When proceed is called after a block with state", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/dashboard", makeLoc("/dashboard"), { state: { from: "/home" } }, { type: "push" });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith("/dashboard", { state: { from: "/home" } });
	});

	it("Should call navigate with delta number When proceed is called after blocking a delta navigation", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/previous", makeLoc("/previous"), undefined, { type: "delta", delta: -1 });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith(-1, undefined);
	});

	it("Should pass through bypassed target When proceed is called after blocking a delta navigation", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/previous?q=1", makeLoc("/previous", "?q=1"), undefined, { type: "delta", delta: -1 });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith(-1, undefined);

		const blocked = registry!.check("/previous?q=1", makeLoc("/previous", "?q=1"), undefined, { type: "push" });
		expect(blocked).toBe(false);
	});

	it("Should call navigate with string When proceed is called after blocking a push navigation", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/about", makeLoc("/about"), { replace: false }, { type: "push" });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith("/about", { replace: false });
	});

	it("Should call navigate with replace options When proceed is called after blocking a replace navigation", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/login", makeLoc("/login"), { replace: true }, { type: "replace" });
		});

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
	});

	it("Should cancel navigation When reset is called after blocking a delta navigation", () => {
		const navigateMock = vi.fn();

		captureRegistry(
			render(<TestHarness shouldBlock={true} />, {
				navigate: navigateMock,
			}),
		);

		act(() => {
			registry!.check("/previous", makeLoc("/previous"), undefined, { type: "delta", delta: -2 });
		});

		act(() => {
			hookResult!.reset();
		});

		expect(navigateMock).not.toHaveBeenCalled();
		expect(hookResult!.isBlocking).toBe(false);
	});

	it("Should relay replace action to navigate When proceed is called after a replace block via full context", () => {
		const navigateMock = vi.fn();
		const store = createLocationStore({ pathname: "/", search: "", hash: "" }, "");
		const localRegistry = createBlockerRegistry();
		registry = localRegistry;

		const navigateWithBlockerCheck = (to: string | number, options?: { replace?: boolean; relative?: "route" | "path" }) => {
			if (typeof to === "number") {
				return;
			}
			const resolvedTo = String(to);
			const blocked = localRegistry.check(resolvedTo, parseTo(resolvedTo), options, {
				type: options?.replace ? "replace" : "push",
			});
			if (blocked) return;
			navigateMock(resolvedTo, options);
		};

		hookResult = null;

		rtlRender(
			<BlockerRegistryContext.Provider value={localRegistry}>
				<LocationStoreContext.Provider value={store}>
					<NavigatorContext.Provider value={navigateWithBlockerCheck}>
						<RoutesContext.Provider value={{ params: {}, routeBase: "" }}>
							<TestHarness shouldBlock={true} />
						</RoutesContext.Provider>
					</NavigatorContext.Provider>
				</LocationStoreContext.Provider>
			</BlockerRegistryContext.Provider>,
		);

		act(() => {
			navigateWithBlockerCheck("/dashboard", { replace: true });
		});

		expect(hookResult!.isBlocking).toBe(true);

		act(() => {
			hookResult!.proceed();
		});

		expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
	});

	it("Should call context-aware callback with nextLocation When isBlocking is invoked", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/target", search: "?q=1", hash: "#sec" };

		act(() => {
			registry!.check("/target?q=1#sec", location, undefined, { type: "push" });
		});

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith({
			nextLocation: location,
			options: undefined,
			action: { type: "push" },
		});
	});

	it("Should call context-aware callback with options When isBlocking is invoked with options", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/target", search: "", hash: "" };
		const options = { replace: true, state: { from: "/home" } };

		act(() => {
			registry!.check("/target", location, options, { type: "replace" });
		});

		expect(spy).toHaveBeenCalledWith({
			nextLocation: location,
			options,
			action: { type: "replace" },
		});
	});

	it("Should call context-aware callback with delta action When isBlocking is invoked with delta", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/prev", search: "", hash: "" };

		act(() => {
			registry!.check("/prev", location, undefined, { type: "delta", delta: -1 });
		});

		expect(spy).toHaveBeenCalledWith({
			nextLocation: location,
			options: undefined,
			action: { type: "delta", delta: -1 },
		});
	});

	it("Should block When context-aware callback returns true", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/target", search: "", hash: "" };

		let blocked = false;
		act(() => {
			blocked = registry!.check("/target", location, undefined, { type: "push" });
		});

		expect(blocked).toBe(true);
	});

	it("Should not block When context-aware callback returns false", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/target", search: "", hash: "" };

		let blocked = true;
		act(() => {
			blocked = registry!.check("/target", location, undefined, { type: "push" });
		});

		expect(blocked).toBe(false);
	});

	it("Should block based on nextLocation pathname When context-aware callback inspects context", () => {
		const spy = vi.fn((ctx: BlockerContext) => ctx.nextLocation.pathname !== "/safe");

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const safeLocation = { pathname: "/safe", search: "", hash: "" };
		const unsafeLocation = { pathname: "/danger", search: "", hash: "" };

		let blockedSafe = true;
		let blockedUnsafe = false;

		act(() => {
			blockedSafe = registry!.check("/safe", safeLocation, undefined, { type: "push" });
		});

		act(() => {
			blockedUnsafe = registry!.check("/danger", unsafeLocation, undefined, { type: "push" });
		});

		expect(blockedSafe).toBe(false);
		expect(blockedUnsafe).toBe(true);
	});

	it("Should pass context to a blocker declared with a default parameter", () => {
		const shouldBlock = (ctx: BlockerContext = { nextLocation: { pathname: "", search: "", hash: "" }, action: { type: "push" } }) =>
			ctx.nextLocation.pathname === "/blocked";

		captureRegistry(render(<TestHarness shouldBlock={shouldBlock} />));

		let blocked = false;
		act(() => {
			blocked = registry!.check("/blocked", makeLoc("/blocked"), undefined, { type: "push" });
		});

		expect(blocked).toBe(true);
	});

	it("Should treat context-aware function as potentially blocking during init", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		expect(spy).not.toHaveBeenCalled();
	});

	it("Should still work When zero-arg callback is used alongside new context-aware type", () => {
		const spy = vi.fn(() => true);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/target", search: "", hash: "" };

		const callsBefore = spy.mock.calls.length;

		let blocked = false;
		act(() => {
			blocked = registry!.check("/target", location, undefined, { type: "push" });
		});

		expect(blocked).toBe(true);
		expect(spy.mock.calls.length).toBeGreaterThanOrEqual(callsBefore + 1);
	});

	it("Should not pass context to zero-arg callback When isBlocking is invoked with location", () => {
		const spy = vi.fn(() => true);

		captureRegistry(render(<TestHarness shouldBlock={spy} />));

		const location = { pathname: "/target", search: "", hash: "" };

		act(() => {
			registry!.check("/target", location, { replace: true }, { type: "replace" });
		});

		expect(spy).toHaveBeenCalledWith();
	});
});
