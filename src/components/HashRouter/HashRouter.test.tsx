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
import { Link } from "../Link";
import { HashRouter } from "./HashRouter";

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

const mockLocation = {
	pathname: "/app",
	search: "",
	hash: "#/initial",
};

const applyUrlToMock = (url: string | URL | null | undefined) => {
	if (url == null) return;
	const parsed = new URL(String(url), "http://localhost");
	mockLocation.pathname = parsed.pathname;
	mockLocation.search = parsed.search;
	mockLocation.hash = parsed.hash;
};

const renderHashRouter = (basename?: string) => {
	rtlRender(
		<HashRouter basename={basename}>
			<RegistryCapture />
			<CaptureContext />
		</HashRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithBlocker = (shouldBlock: boolean | (() => boolean)) => {
	rtlRender(
		<HashRouter>
			<RegistryCapture />
			<BlockingComponent shouldBlock={shouldBlock} />
		</HashRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithCapturingBlocker = (shouldBlock: boolean | (() => boolean)) => {
	rtlRender(
		<HashRouter>
			<RegistryCapture />
			<CapturingBlockerComponent shouldBlock={shouldBlock} />
		</HashRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlocker: () => capturedBlocker!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

describe("HashRouter", () => {
	beforeEach(() => {
		capturedLocation = null;
		capturedNavigate = null;
		capturedHookNavigate = null;
		capturedBlocker = null;
		mockLocation.pathname = "/app";
		mockLocation.search = "";
		mockLocation.hash = "#/initial";

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

	it("Should provide initial location from window.location.hash", () => {
		const { getLocation } = renderHashRouter();

		expect(getLocation().pathname).toBe("/initial");
		expect(getLocation().search).toBe("");
		expect(getLocation().hash).toBe("");
	});

	it("Should return '/' When hash is empty", () => {
		mockLocation.hash = "";

		const { getLocation } = renderHashRouter();

		expect(getLocation().pathname).toBe("/");
	});

	it("Should parse query string from hash", () => {
		mockLocation.hash = "#/posts?page=3&status=published";

		const { getLocation } = renderHashRouter();

		expect(getLocation().pathname).toBe("/posts");
		expect(getLocation().search).toBe("?page=3&status=published");
	});

	it("Should prepend '#' to link hrefs", () => {
		rtlRender(
			<HashRouter>
				<Link to="/dashboard">Dashboard</Link>
			</HashRouter>,
		);

		expect(screen.getByRole("link")).toHaveAttribute("href", "#/dashboard");
	});

	it("Should include basename in link href prefix", () => {
		rtlRender(
			<HashRouter basename="/admin">
				<Link to="/users">Users</Link>
			</HashRouter>,
		);

		expect(screen.getByRole("link")).toHaveAttribute("href", "#/admin/users");
	});

	it("Should normalize basename trailing slash in link href", () => {
		rtlRender(
			<HashRouter basename="/admin/">
				<Link to="/users">Users</Link>
			</HashRouter>,
		);

		expect(screen.getByRole("link")).toHaveAttribute("href", "#/admin/users");
	});

	it("Should set location.hash When navigating", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("/users");
		});

		expect(window.location.hash).toBe("#/users");
	});

	it("Should update location synchronously When navigating", () => {
		const { getNavigate, getLocation } = renderHashRouter();

		act(() => {
			getNavigate()("/dashboard");
		});

		expect(getLocation().pathname).toBe("/dashboard");
	});

	it("Should call history.replaceState When navigating with replace option", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("/login", { replace: true });
		});

		expect(window.history.replaceState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "#/login");
	});

	it("Should update location synchronously When navigating with replace", () => {
		const { getNavigate, getLocation } = renderHashRouter();

		act(() => {
			getNavigate()("/settings", { replace: true });
		});

		expect(getLocation().pathname).toBe("/settings");
	});

	it("Should resolve plain segment relative to current pathname When navigating without leading slash", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("profile");
		});

		expect(window.location.hash).toBe("#/initial/profile");
	});

	it("Should update location When hashchange event fires", () => {
		vi.useFakeTimers();
		const { getLocation } = renderHashRouter();

		mockLocation.hash = "#/new-path";

		act(() => {
			window.dispatchEvent(new Event("hashchange"));
			vi.runAllTimers();
		});

		expect(getLocation().pathname).toBe("/new-path");
		vi.useRealTimers();
	});

	it("Should clear the pending hashchange timer When popstate fires before it runs", () => {
		vi.useFakeTimers();
		const { getLocation } = renderHashRouter();

		mockLocation.hash = "#/new-path";

		act(() => {
			window.dispatchEvent(new Event("hashchange"));
		});

		expect(getLocation().pathname).toBe("/initial");

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/new-path");

		act(() => {
			vi.runAllTimers();
		});

		expect(getLocation().pathname).toBe("/new-path");
		vi.useRealTimers();
	});

	it("Should strip basename from initial hash pathname", () => {
		mockLocation.hash = "#/admin/users";

		const { getLocation } = renderHashRouter("/admin");

		expect(getLocation().pathname).toBe("/users");
	});

	it("Should return '/' When hash equals basename exactly", () => {
		mockLocation.hash = "#/admin";

		const { getLocation } = renderHashRouter("/admin");

		expect(getLocation().pathname).toBe("/");
	});

	it("Should prepend basename in navigate hash URL", () => {
		const { getNavigate } = renderHashRouter("/admin");

		act(() => {
			getNavigate()("/dashboard");
		});

		expect(window.location.hash).toBe("#/admin/dashboard");
	});

	it("Should not strip basename across segment boundary", () => {
		mockLocation.hash = "#/administration/users";

		const { getLocation } = renderHashRouter("/admin");

		expect(getLocation().pathname).toBe("/administration/users");
	});

	it("Should strip basename with query string in hash", () => {
		mockLocation.hash = "#/admin/dashboard?tab=1";

		const { getLocation } = renderHashRouter("/admin");

		expect(getLocation().pathname).toBe("/dashboard");
		expect(getLocation().search).toBe("?tab=1");
	});

	it("Should update location from hashchange When using basename", () => {
		vi.useFakeTimers();
		const { getLocation } = renderHashRouter("/admin");

		mockLocation.hash = "#/admin/settings";

		act(() => {
			window.dispatchEvent(new Event("hashchange"));
			vi.runAllTimers();
		});

		expect(getLocation().pathname).toBe("/settings");
		vi.useRealTimers();
	});

	it("Should not strip basename from hash When segment boundary does not match after basename", () => {
		mockLocation.hash = "#/administer/panel";

		const { getLocation } = renderHashRouter("/admin");

		expect(getLocation().pathname).toBe("/administer/panel");
	});

	it("Should handle hash without leading slash after #", () => {
		mockLocation.hash = "#users";

		const { getLocation } = renderHashRouter();

		expect(getLocation().pathname).toBe("users");
	});

	it("Should resolve '..' to parent pathname in hash When navigating with a relative path", () => {
		mockLocation.hash = "#/users/42";
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("..");
		});

		expect(window.location.hash).toBe("#/users");
	});

	it("Should resolve '..' with basename prepended to hash When using basename and relative path", () => {
		mockLocation.hash = "#/admin/users/42";
		const { getNavigate } = renderHashRouter("/admin");

		act(() => {
			getNavigate()("..");
		});

		expect(window.location.hash).toBe("#/admin/users");
	});

	it("Should resolve '..' and call replaceState When navigating with replace and relative path", () => {
		mockLocation.hash = "#/users/42";
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("..", { replace: true });
		});

		expect(window.history.replaceState).toHaveBeenCalledWith(expect.objectContaining({ idx: expect.any(Number) }), "", "#/users");
	});

	it("Should resolve relative path against pathname When relative is 'route' without Routes wrapper", () => {
		mockLocation.hash = "#/users/42";
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("..", { relative: "route" });
		});

		expect(window.location.hash).toBe("#/users");
	});

	it("Should update location with internal hash from hashchange event", () => {
		vi.useFakeTimers();
		const { getLocation } = renderHashRouter();

		mockLocation.hash = "#/new-path#anchor";

		act(() => {
			window.dispatchEvent(new Event("hashchange"));
			vi.runAllTimers();
		});

		expect(getLocation().pathname).toBe("/new-path");
		expect(getLocation().hash).toBe("#anchor");
		vi.useRealTimers();
	});

	it("Should include hash fragment in URL When navigating", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("/page#section");
		});

		expect(window.location.hash).toBe("#/page#section");
	});

	it("Should parse location correctly after navigating with hash fragment", () => {
		const { getNavigate, getLocation } = renderHashRouter();

		act(() => {
			getNavigate()("/page#section");
		});

		expect(getLocation().pathname).toBe("/page");
		expect(getLocation().hash).toBe("#section");
	});

	it("Should update location When popstate event fires", () => {
		const { getLocation } = renderHashRouter();

		mockLocation.hash = "#/new-path";

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/new-path");
	});

	it("Should block navigation When popstate fires and a blocker is active", () => {
		const { getLocation } = renderWithBlocker(true);

		act(() => {
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/initial");
	});

	it("Should not block navigation When popstate fires and no blocker is active", () => {
		const { getLocation } = renderWithBlocker(false);

		act(() => {
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should accept navigation When popstate fires with null state regardless of blocker", () => {
		const { getLocation } = renderWithBlocker(true);

		act(() => {
			mockLocation.hash = "#/external";
			window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
		});

		expect(getLocation().pathname).toBe("/external");
	});

	it("Should call history.go to revert When popstate is blocked", () => {
		renderWithBlocker(true);

		const goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});

		act(() => {
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(goSpy).toHaveBeenCalledWith(-1);

		goSpy.mockRestore();
	});

	it("Should not call history.go When popstate is not blocked", () => {
		renderWithBlocker(false);

		const goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});

		act(() => {
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(goSpy).not.toHaveBeenCalled();

		goSpy.mockRestore();
	});

	it("Should ignore a second popstate When revertingRef is true from a prior blocked popstate", () => {
		const { getLocation } = renderWithBlocker(true);
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(goSpy).toHaveBeenCalledWith(-1);
		expect(getLocation().pathname).toBe("/initial");

		act(() => {
			mockLocation.hash = "#/should-be-ignored";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 0 } }));
		});

		expect(getLocation().pathname).toBe("/initial");
		goSpy.mockRestore();
	});

	it("Should ignore hashchange When blockingPopStateRef is true after a blocked popstate", () => {
		vi.useFakeTimers();
		const { getLocation } = renderWithBlocker(true);

		act(() => {
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getLocation().pathname).toBe("/initial");

		mockLocation.hash = "#/should-be-ignored-via-hashchange";
		act(() => {
			window.dispatchEvent(new Event("hashchange"));
			vi.runAllTimers();
		});

		expect(getLocation().pathname).toBe("/initial");
		vi.useRealTimers();
	});

	it("Should include state in pushState When navigating with state", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" } });
		});

		expect(window.history.pushState).toHaveBeenCalledWith(
			expect.objectContaining({ idx: expect.any(Number), usr: { from: "/login" } }),
			"",
			"#/dashboard",
		);
	});

	it("Should include state in replaceState When navigating with state and replace", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" }, replace: true });
		});

		expect(window.history.replaceState).toHaveBeenCalledWith(
			expect.objectContaining({ idx: expect.any(Number), usr: { from: "/login" } }),
			"",
			"#/dashboard",
		);
	});

	it("Should reflect state synchronously in useLocation When navigating with state", () => {
		(window.history.pushState as ReturnType<typeof vi.fn>).mockImplementation(
			(data: unknown, _title: unknown, url: string | URL | null | undefined) => {
				applyUrlToMock(url);
				(window.history as unknown as Record<string, unknown>).state = data;
			},
		);

		const { getNavigate, getLocation } = renderHashRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" } });
		});

		expect(getLocation().state).toEqual({ from: "/login" });
	});

	it("Should not include usr in pushState When navigating without state", () => {
		const { getNavigate } = renderHashRouter();

		act(() => {
			getNavigate()("/dashboard");
		});

		const callArgs = (window.history.pushState as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(callArgs).not.toHaveProperty("usr");
	});

	it("Should return state in useLocation When popstate fires with state", () => {
		const { getLocation } = renderHashRouter();

		(window.history as unknown as Record<string, unknown>).state = { idx: 1, usr: { message: "from-popstate" } };
		mockLocation.hash = "#/new-path";

		act(() => {
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1, usr: { message: "from-popstate" } } }));
		});

		expect(getLocation().pathname).toBe("/new-path");
		expect(getLocation().state).toEqual({ message: "from-popstate" });
	});

	it("Should merge existing state with idx reset on mount initialization", () => {
		(window.history as unknown as Record<string, unknown>).state = { idx: 5, usr: { message: "preserved" } };

		renderHashRouter();

		expect(window.history.replaceState).toHaveBeenCalledWith(expect.objectContaining({ idx: 0, usr: { message: "preserved" } }), "");
	});

	it("Should call history.go When navigating with negative delta", () => {
		const { getNavigate } = renderHashRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(-1);
		});

		expect(goSpy).toHaveBeenCalledWith(-1);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When navigating with positive delta", () => {
		const { getNavigate } = renderHashRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(1);
		});

		expect(goSpy).toHaveBeenCalledWith(1);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should not call history.go When navigating with delta zero", () => {
		const { getNavigate } = renderHashRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(0);
		});

		expect(goSpy).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When useNavigate is called with negative delta inside HashRouter", () => {
		rtlRender(
			<HashRouter>
				<NavigateHookHarness />
			</HashRouter>,
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
		const { getNavigate } = renderHashRouter();
		const goSpy = vi.spyOn(window.history, "go");

		act(() => {
			getNavigate()(-2);
		});

		expect(goSpy).toHaveBeenCalledWith(-2);
		expect(window.history.pushState).not.toHaveBeenCalled();
		goSpy.mockRestore();
	});

	it("Should call history.go When navigating with delta three", () => {
		const { getNavigate } = renderHashRouter();
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

		const { getNavigate, getBlockerRegistry } = renderHashRouter();
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

		const { getNavigate, getBlockerRegistry } = renderHashRouter();
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

		const { getBlockerRegistry } = renderHashRouter();
		getBlockerRegistry().register(registration);

		act(() => {
			mockLocation.hash = "#/about";
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
			mockLocation.hash = "#/about";
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
			mockLocation.hash = "#/about";
			window.dispatchEvent(new PopStateEvent("popstate", { state: { idx: 1 } }));
		});

		expect(getBlocker().isBlocking).toBe(true);

		act(() => {
			getBlocker().proceed();
		});

		expect(window.history.pushState).not.toHaveBeenCalled();
	});
});
