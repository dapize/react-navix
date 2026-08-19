import { act, useContext } from "react";
import { render as rtlRender, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockerRegistry } from "@stores/blockers";
import type { Location } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { type NavigateFunction, NavigatorContext } from "@contexts/NavigatorContext";
import type { Blocker } from "@hooks/useBlocker";
import { useBlocker } from "@hooks/useBlocker";
import { useLocation } from "@hooks/useLocation";
import { useNavigate } from "@hooks/useNavigate";
import type { BlockerContext } from "@hooks/useResolvedBlocker";
import { Link } from "@components/Link";
import { BrowserRouter } from "./BrowserRouter";

let capturedLocation: Location | null = null;
let capturedNavigate: NavigateFunction | null = null;
let capturedHookNavigate: NavigateFunction | null = null;
let capturedBlocker: Blocker | null = null;
let capturedBlockerRegistry: BlockerRegistry | null = null;

const RegistryCapture = () => {
	capturedBlockerRegistry = useContext(BlockerRegistryContext);
	return null;
};

const CaptureContext = () => {
	capturedLocation = useLocation();
	capturedNavigate = useContext(NavigatorContext);
	return null;
};

const NavigateHookHarness = () => {
	capturedHookNavigate = useNavigate();
	capturedLocation = useLocation();
	return null;
};

const BlockingComponent = ({ shouldBlock }: { shouldBlock: boolean | (() => boolean) }) => {
	useBlocker(shouldBlock);
	capturedLocation = useLocation();
	capturedNavigate = useContext(NavigatorContext);
	return null;
};

const CapturingBlockerComponent = ({ shouldBlock }: { shouldBlock: boolean | (() => boolean) }) => {
	capturedBlocker = useBlocker(shouldBlock);
	capturedLocation = useLocation();
	capturedNavigate = useContext(NavigatorContext);
	return null;
};

interface MockLocation {
	pathname: string;
	search: string;
	hash: string;
}

const mockLocation: MockLocation = {
	pathname: "/initial",
	search: "",
	hash: "",
};

const applyUrlToMock = (url: string | URL | null | undefined) => {
	if (url == null) return;
	const parsed = new URL(String(url), "http://localhost");
	mockLocation.pathname = parsed.pathname;
	mockLocation.search = parsed.search;
	mockLocation.hash = parsed.hash;
};

const renderBrowserRouter = (basename?: string) => {
	rtlRender(
		<BrowserRouter basename={basename}>
			<RegistryCapture />
			<CaptureContext />
		</BrowserRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithBlocker = (shouldBlock: boolean | (() => boolean)) => {
	rtlRender(
		<BrowserRouter>
			<RegistryCapture />
			<BlockingComponent shouldBlock={shouldBlock} />
		</BrowserRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithCapturingBlocker = (shouldBlock: boolean | (() => boolean)) => {
	rtlRender(
		<BrowserRouter>
			<RegistryCapture />
			<CapturingBlockerComponent shouldBlock={shouldBlock} />
		</BrowserRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlocker: () => capturedBlocker!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const ContextAwareSpyComponent = ({ spy }: { spy: (ctx: BlockerContext) => boolean }) => {
	useBlocker(spy);
	capturedLocation = useLocation();
	capturedNavigate = useContext(NavigatorContext);
	return null;
};

const ContextAwareCapturingSpy = ({ spy }: { spy: (ctx: BlockerContext) => boolean }) => {
	capturedBlocker = useBlocker(spy);
	capturedLocation = useLocation();
	capturedNavigate = useContext(NavigatorContext);
	return null;
};

const renderWithContextAwareBlocker = (spy: (ctx: BlockerContext) => boolean) => {
	rtlRender(
		<BrowserRouter>
			<RegistryCapture />
			<ContextAwareSpyComponent spy={spy} />
		</BrowserRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithContextAwareCapturingBlocker = (spy: (ctx: BlockerContext) => boolean) => {
	rtlRender(
		<BrowserRouter>
			<RegistryCapture />
			<ContextAwareCapturingSpy spy={spy} />
		</BrowserRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlocker: () => capturedBlocker!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

describe("BrowserRouter", () => {
	beforeEach(() => {
		capturedLocation = null;
		capturedNavigate = null;
		capturedHookNavigate = null;
		capturedBlocker = null;
		mockLocation.pathname = "/initial";
		mockLocation.search = "";
		mockLocation.hash = "";

		Object.defineProperty(window, "location", {
			configurable: true,
			value: mockLocation,
		});

		vi.spyOn(window.history, "pushState").mockImplementation((_data, _title, url) => {
			applyUrlToMock(url);
		});
		vi.spyOn(window.history, "replaceState").mockImplementation((_data, _title, url) => {
			applyUrlToMock(url);
		});
		vi.spyOn(window.history, "go").mockImplementation(() => {});

		Object.defineProperty(window.history, "state", {
			configurable: true,
			writable: true,
			value: null,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("Should provide initial location from window.location.pathname", () => {
		const { getLocation } = renderBrowserRouter();

		expect(getLocation().pathname).toBe("/initial");
	});

	it("Should provide initial search from window.location.search", () => {
		mockLocation.search = "?q=hello";

		const { getLocation } = renderBrowserRouter();

		expect(getLocation().search).toBe("?q=hello");
	});

	it("Should provide initial hash from window.location.hash", () => {
		mockLocation.hash = "#section";

		const { getLocation } = renderBrowserRouter();

		expect(getLocation().hash).toBe("#section");
	});

	it("Should call pushState with the target URL When navigating", () => {
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("/users");
		});

		expect(window.history.pushState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/users");
	});

	it("Should update location When navigating with push", () => {
		const { getNavigate, getLocation } = renderBrowserRouter();

		act(() => {
			getNavigate()("/dashboard");
		});

		expect(getLocation().pathname).toBe("/dashboard");
	});

	it("Should call replaceState When navigating with replace option", () => {
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("/login", { replace: true });
		});

		expect(window.history.replaceState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/login");
	});

	it("Should update location When navigating with replace", () => {
		const { getNavigate, getLocation } = renderBrowserRouter();

		act(() => {
			getNavigate()("/settings", { replace: true });
		});

		expect(getLocation().pathname).toBe("/settings");
	});

	it("Should update location When popstate event fires", () => {
		const { getLocation } = renderBrowserRouter();

		mockLocation.pathname = "/new-path";

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/new-path");
	});

	it("Should strip basename from initial location pathname", () => {
		mockLocation.pathname = "/app/users";

		const { getLocation } = renderBrowserRouter("/app");

		expect(getLocation().pathname).toBe("/users");
	});

	it("Should return '/' When pathname equals basename exactly", () => {
		mockLocation.pathname = "/app";

		const { getLocation } = renderBrowserRouter("/app");

		expect(getLocation().pathname).toBe("/");
	});

	it("Should prepend basename to the URL When navigating", () => {
		const { getNavigate } = renderBrowserRouter("/app");

		act(() => {
			getNavigate()("/dashboard");
		});

		expect(window.history.pushState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/app/dashboard");
	});

	it("Should not strip basename When segment boundary does not match", () => {
		mockLocation.pathname = "/appp/users";

		const { getLocation } = renderBrowserRouter("/app");

		expect(getLocation().pathname).toBe("/appp/users");
	});

	it("Should strip basename with trailing slash correctly", () => {
		mockLocation.pathname = "/app/users";

		const { getLocation } = renderBrowserRouter("/app/");

		expect(getLocation().pathname).toBe("/users");
	});

	it("Should handle root path When basename matches exactly with trailing slash", () => {
		mockLocation.pathname = "/app/";

		const { getLocation } = renderBrowserRouter("/app");

		expect(getLocation().pathname).toBe("/");
	});

	it("Should produce normalized href from Link When basename has trailing slash", () => {
		mockLocation.pathname = "/app/dashboard";

		rtlRender(
			<BrowserRouter basename="/app/">
				<Link to="/users">Users</Link>
			</BrowserRouter>,
		);

		const anchor = screen.getByRole("link", { name: "Users" });
		expect(anchor.getAttribute("href")).toBe("/app/users");
	});

	it("Should preserve search and hash When stripping basename", () => {
		mockLocation.pathname = "/app/dashboard";
		mockLocation.search = "?tab=1";
		mockLocation.hash = "#top";

		const { getLocation } = renderBrowserRouter("/app");

		expect(getLocation().pathname).toBe("/dashboard");
		expect(getLocation().search).toBe("?tab=1");
		expect(getLocation().hash).toBe("#top");
	});

	it("Should update location from popstate When using basename", () => {
		const { getLocation } = renderBrowserRouter("/app");

		mockLocation.pathname = "/app/settings";

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/settings");
	});

	it("Should not return pathname When basename matches partially across segment", () => {
		mockLocation.pathname = "/application/settings";

		const { getLocation } = renderBrowserRouter("/app");

		expect(getLocation().pathname).toBe("/application/settings");
	});

	it("Should resolve '..' to parent pathname When navigating with a relative path", () => {
		mockLocation.pathname = "/users/42";
		const { getNavigate, getLocation } = renderBrowserRouter();

		act(() => {
			getNavigate()("..");
		});

		expect(window.history.pushState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/users");
		expect(getLocation().pathname).toBe("/users");
	});

	it("Should resolve '../sibling' to sibling pathname When navigating with a relative path", () => {
		mockLocation.pathname = "/users/42";
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("../settings");
		});

		expect(window.history.pushState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/users/settings");
	});

	it("Should resolve 'child' relative to current basename-stripped path When using basename", () => {
		mockLocation.pathname = "/app/dashboard";
		const { getNavigate, getLocation } = renderBrowserRouter("/app");

		act(() => {
			getNavigate()("child");
		});

		expect(window.history.pushState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/app/dashboard/child");
		expect(getLocation().pathname).toBe("/dashboard/child");
	});

	it("Should resolve '..' and call replaceState When navigating with replace option and relative path", () => {
		mockLocation.pathname = "/users/42";
		const { getNavigate, getLocation } = renderBrowserRouter();

		act(() => {
			getNavigate()("..", { replace: true });
		});

		expect(window.history.replaceState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/users");
		expect(getLocation().pathname).toBe("/users");
	});

	it("Should resolve relative path against pathname When relative is 'route' without Routes wrapper", () => {
		mockLocation.pathname = "/users/42";
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("..", { relative: "route" });
		});

		expect(window.history.pushState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "/users");
	});

	it("Should block navigation When popstate fires and a blocker is active", () => {
		const { getLocation } = renderWithBlocker(true);

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/initial");
	});

	it("Should not block navigation When popstate fires and no blocker is active", () => {
		const { getLocation } = renderWithBlocker(false);

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should accept navigation When popstate fires with null state regardless of blocker", () => {
		const { getLocation } = renderWithBlocker(true);

		act(() => {
			mockLocation.pathname = "/external";
			window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
		});

		expect(getLocation().pathname).toBe("/external");
	});

	it("Should call history.go to revert When popstate is blocked", () => {
		renderWithBlocker(true);
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(goSpy).toHaveBeenCalledWith(-1);
		goSpy.mockRestore();
	});

	it("Should not call history.go When popstate is not blocked", () => {
		renderWithBlocker(false);
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(goSpy).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should ignore a second popstate When revertingRef is true from a prior blocked popstate", () => {
		const { getLocation } = renderWithBlocker(true);
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(goSpy).toHaveBeenCalledWith(-1);
		expect(getLocation().pathname).toBe("/initial");

		act(() => {
			mockLocation.pathname = "/should-be-ignored";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 0 } }));
		});

		expect(getLocation().pathname).toBe("/initial");
		goSpy.mockRestore();
	});

	it("Should include state in pushState When navigating with state", () => {
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" } });
		});

		expect(window.history.pushState).toHaveBeenCalledWith(
			expect.objectContaining({ idx: expect.any(Number), usr: { from: "/login" } }),
			"",
			"/dashboard",
		);
	});

	it("Should include state in replaceState When navigating with state and replace", () => {
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" }, replace: true });
		});

		expect(window.history.replaceState).toHaveBeenCalledWith(
			expect.objectContaining({ idx: expect.any(Number), usr: { from: "/login" } }),
			"",
			"/dashboard",
		);
	});

	it("Should reflect state synchronously in useLocation When navigating with state", () => {
		(window.history.pushState as ReturnType<typeof vi.fn>).mockImplementation(
			(data: unknown, _title: unknown, url: string | URL | null | undefined) => {
				applyUrlToMock(url);
				(window.history as unknown as Record<string, unknown>).state = data;
			},
		);

		const { getNavigate, getLocation } = renderBrowserRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" } });
		});

		expect(getLocation().state).toEqual({ from: "/login" });
	});

	it("Should not include usr in pushState When navigating without state", () => {
		const { getNavigate } = renderBrowserRouter();

		act(() => {
			getNavigate()("/dashboard");
		});

		const callArgs = (window.history.pushState as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(callArgs).not.toHaveProperty("usr");
	});

	it("Should return state in useLocation When popstate fires with state", () => {
		const { getLocation } = renderBrowserRouter();

		(window.history as unknown as Record<string, unknown>).state = { idx: 1, usr: { message: "from-popstate" } };
		mockLocation.pathname = "/new-path";

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1, usr: { message: "from-popstate" } } }));
		});

		expect(getLocation().pathname).toBe("/new-path");
		expect(getLocation().state).toEqual({ message: "from-popstate" });
	});

	it("Should merge existing state with idx reset on mount initialization", () => {
		(window.history as unknown as Record<string, unknown>).state = { idx: 5, usr: { message: "preserved" } };

		renderBrowserRouter();

		expect(window.history.replaceState).toHaveBeenCalledWith(expect.objectContaining({ idx: 0, usr: { message: "preserved" } }), "");
	});

	it("Should call history.go When navigating with negative delta", () => {
		const { getNavigate } = renderBrowserRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(-1);
		});

		expect(goSpy).toHaveBeenCalledWith(-1);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When navigating with positive delta", () => {
		const { getNavigate } = renderBrowserRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(1);
		});

		expect(goSpy).toHaveBeenCalledWith(1);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should not call history.go When navigating with delta zero", () => {
		const { getNavigate } = renderBrowserRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(0);
		});

		expect(goSpy).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When useNavigate is called with negative delta inside BrowserRouter", () => {
		rtlRender(
			<BrowserRouter>
				<NavigateHookHarness />
			</BrowserRouter>,
		);
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			capturedHookNavigate!(-1);
		});

		expect(goSpy).toHaveBeenCalledWith(-1);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When navigating with delta negative two", () => {
		const { getNavigate } = renderBrowserRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(-2);
		});

		expect(goSpy).toHaveBeenCalledWith(-2);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When navigating with delta three", () => {
		const { getNavigate } = renderBrowserRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(3);
		});

		expect(goSpy).toHaveBeenCalledWith(3);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should pass push action to onBlock When navigating with a string path", () => {
		const onBlockSpy = vi.fn();
		const registration = {
			isBlocking: () => true,
			onBlock: onBlockSpy,
		};

		const { getNavigate, getBlockerRegistry } = renderBrowserRouter();
		getBlockerRegistry().register(registration);

		act(() => {
			getNavigate()("/about");
		});

		expect(onBlockSpy).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/about" }), undefined, {
			type: "push",
		});

		getBlockerRegistry().unregister(registration);
	});

	it("Should pass replace action to onBlock When navigating with replace option", () => {
		const onBlockSpy = vi.fn();
		const registration = {
			isBlocking: () => true,
			onBlock: onBlockSpy,
		};

		const { getNavigate, getBlockerRegistry } = renderBrowserRouter();
		getBlockerRegistry().register(registration);

		act(() => {
			getNavigate()("/login", { replace: true });
		});

		expect(onBlockSpy).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/login" }), expect.objectContaining({ replace: true }), {
			type: "replace",
		});

		getBlockerRegistry().unregister(registration);
	});

	it("Should pass delta action to onBlock When popstate fires with a blocker active", () => {
		const onBlockSpy = vi.fn();
		const registration = {
			isBlocking: () => true,
			onBlock: onBlockSpy,
		};

		const { getBlockerRegistry } = renderBrowserRouter();
		getBlockerRegistry().register(registration);

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(onBlockSpy).toHaveBeenCalledWith(
			expect.objectContaining({ pathname: "/about" }),
			expect.objectContaining({ state: undefined }),
			{ type: "delta", delta: 1 },
		);

		getBlockerRegistry().unregister(registration);
	});

	it("Should call history.go with correct delta When proceed is called after blocking a popstate", () => {
		const { getBlocker } = renderWithCapturingBlocker(true);
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getBlocker().isBlocking).toBe(true);

		act(() => {
			getBlocker().proceed();
		});

		expect(goSpy).toHaveBeenCalledWith(1);
		goSpy.mockRestore();
	});

	it("Should not create duplicate history entries When proceed is called after blocking a delta navigation", () => {
		const { getBlocker } = renderWithCapturingBlocker(true);

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getBlocker().isBlocking).toBe(true);

		act(() => {
			getBlocker().proceed();
		});

		expect(window.history.pushState).not.toHaveBeenCalled();
	});

	it("Should pass nextLocation and push action to context-aware blocker When navigating via navigate()", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		const { getNavigate, getLocation } = renderWithContextAwareBlocker(spy);

		act(() => {
			getNavigate()("/blog");
		});

		expect(getLocation().pathname).toBe("/blog");
		expect(spy).toHaveBeenCalledWith({
			nextLocation: expect.objectContaining({ pathname: "/blog" }),
			options: undefined,
			action: { type: "push" },
		});
	});

	it("Should pass nextLocation and replace action to context-aware blocker When navigating with replace", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		const { getNavigate, getLocation } = renderWithContextAwareBlocker(spy);

		act(() => {
			getNavigate()("/dashboard", { replace: true });
		});

		expect(getLocation().pathname).toBe("/dashboard");
		expect(spy).toHaveBeenCalledWith({
			nextLocation: expect.objectContaining({ pathname: "/dashboard" }),
			options: expect.objectContaining({ replace: true }),
			action: { type: "replace" },
		});
	});

	it("Should pass options state to context-aware blocker When navigating with state", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		const { getNavigate } = renderWithContextAwareBlocker(spy);

		act(() => {
			getNavigate()("/profile", { state: { from: "/home" }, replace: true });
		});

		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({
				nextLocation: expect.objectContaining({ state: { from: "/home" } }),
				options: expect.objectContaining({ state: { from: "/home" } }),
			}),
		);
	});

	it("Should block navigate When context-aware blocker returns true for specific pathname", () => {
		const spy = vi.fn((ctx: BlockerContext) => ctx.nextLocation.pathname === "/blocked");

		const { getNavigate, getLocation } = renderWithContextAwareBlocker(spy);

		act(() => {
			getNavigate()("/safe");
		});

		expect(getLocation().pathname).toBe("/safe");

		act(() => {
			getNavigate()("/blocked");
		});

		expect(getLocation().pathname).toBe("/safe");
	});

	it("Should receive blocked nextLocation in blocker state When context-aware function blocks", () => {
		const spy = vi.fn((ctx: BlockerContext) => ctx.nextLocation.pathname !== "/safe");

		const { getNavigate, getBlocker } = renderWithContextAwareCapturingBlocker(spy);

		act(() => {
			getNavigate()("/danger");
		});

		expect(getBlocker().isBlocking).toBe(true);
		expect(getBlocker().nextLocation.pathname).toBe("/danger");

		act(() => {
			getBlocker().proceed();
		});

		expect(getBlocker().isBlocking).toBe(false);
	});

	it("Should pass delta action to context-aware blocker When popstate fires", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		renderWithContextAwareBlocker(spy);

		act(() => {
			mockLocation.pathname = "/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(spy).toHaveBeenCalled();
		const call = spy.mock.calls[spy.mock.calls.length - 1][0] as BlockerContext;
		expect(call.action.type).toBe("delta");
		expect((call.action as { type: "delta"; delta: number }).delta).toBeTypeOf("number");
	});
});
