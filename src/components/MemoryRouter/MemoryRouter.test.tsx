import { act, useContext } from "react";
import { render as rtlRender, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockerRegistry } from "@stores/blockers";
import type { Location } from "@stores/location";
import { BlockerRegistryContext } from "@contexts/BlockerRegistryContext";
import { type NavigateFunction, NavigatorContext } from "@contexts/NavigatorContext";
import type { Blocker } from "@hooks/useBlocker";
import { useBlocker } from "@hooks/useBlocker";
import { useInRouterContext } from "@hooks/useInRouterContext";
import { useLocation } from "@hooks/useLocation";
import { useNavigate } from "@hooks/useNavigate";
import type { BlockerContext } from "@hooks/useResolvedBlocker";
import { Link } from "@components/Link";
import { MemoryRouter } from "./MemoryRouter";

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

const renderMemoryRouter = (initialEntries?: string[], initialIndex?: number, basename?: string) => {
	rtlRender(
		<MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex} basename={basename}>
			<RegistryCapture />
			<CaptureContext />
		</MemoryRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithBlocker = (shouldBlock: boolean | (() => boolean), initialEntries?: string[], initialIndex?: number) => {
	rtlRender(
		<MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
			<RegistryCapture />
			<BlockingComponent shouldBlock={shouldBlock} />
		</MemoryRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithCapturingBlocker = (shouldBlock: boolean | (() => boolean)) => {
	rtlRender(
		<MemoryRouter initialEntries={["/home", "/about"]} initialIndex={1}>
			<RegistryCapture />
			<CapturingBlockerComponent shouldBlock={shouldBlock} />
		</MemoryRouter>,
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

const renderWithContextAwareBlocker = (spy: (ctx: BlockerContext) => boolean, initialEntries?: string[], initialIndex?: number) => {
	rtlRender(
		<MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
			<RegistryCapture />
			<ContextAwareSpyComponent spy={spy} />
		</MemoryRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedNavigate!,
		getBlockerRegistry: () => capturedBlockerRegistry!,
	};
};

const renderWithNavigateHook = (initialEntries?: string[]) => {
	rtlRender(
		<MemoryRouter initialEntries={initialEntries}>
			<NavigateHookHarness />
		</MemoryRouter>,
	);

	return {
		getLocation: () => capturedLocation!,
		getNavigate: () => capturedHookNavigate!,
	};
};

describe("MemoryRouter", () => {
	beforeEach(() => {
		capturedLocation = null;
		capturedNavigate = null;
		capturedHookNavigate = null;
		capturedBlocker = null;
		capturedBlockerRegistry = null;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("Should provide initial location '/' When no initialEntries are provided", () => {
		const { getLocation } = renderMemoryRouter();

		expect(getLocation().pathname).toBe("/");
		expect(getLocation().search).toBe("");
		expect(getLocation().hash).toBe("");
	});

	it("Should provide initial location from a single initialEntry", () => {
		const { getLocation } = renderMemoryRouter(["/users/42"]);

		expect(getLocation().pathname).toBe("/users/42");
	});

	it("Should provide initial search from an initialEntry with query", () => {
		const { getLocation } = renderMemoryRouter(["/search?q=hello"]);

		expect(getLocation().search).toBe("?q=hello");
	});

	it("Should provide initial hash from an initialEntry with hash", () => {
		const { getLocation } = renderMemoryRouter(["/page#section"]);

		expect(getLocation().hash).toBe("#section");
	});

	it("Should provide initial location from the entry at initialIndex", () => {
		const { getLocation } = renderMemoryRouter(["/home", "/about", "/contact"], 2);

		expect(getLocation().pathname).toBe("/contact");
	});

	it("Should default initialIndex to 0", () => {
		const { getLocation } = renderMemoryRouter(["/first", "/second"]);

		expect(getLocation().pathname).toBe("/first");
	});

	it("Should clamp initialIndex When it exceeds entries length", () => {
		const { getLocation } = renderMemoryRouter(["/a", "/b", "/c"], 10);

		expect(getLocation().pathname).toBe("/c");
	});

	it("Should clamp initialIndex When negative", () => {
		const { getLocation } = renderMemoryRouter(["/a", "/b", "/c"], -5);

		expect(getLocation().pathname).toBe("/a");
	});

	it("Should assign a unique key to each initial entry", () => {
		renderMemoryRouter(["/one", "/two", "/three"]);

		expect(capturedLocation?.key).toBeDefined();
		expect(typeof capturedLocation?.key).toBe("string");
	});

	it("Should return true from useInRouterContext When inside MemoryRouter", () => {
		let inRouter = false;
		const Probe = () => {
			inRouter = useInRouterContext();
			return null;
		};

		rtlRender(
			<MemoryRouter>
				<Probe />
			</MemoryRouter>,
		);

		expect(inRouter).toBe(true);
	});

	it("Should update location When navigating with push", () => {
		const { getNavigate, getLocation } = renderMemoryRouter();

		act(() => {
			getNavigate()("/dashboard");
		});

		expect(getLocation().pathname).toBe("/dashboard");
	});

	it("Should update location When navigating with replace", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home"]);

		act(() => {
			getNavigate()("/settings", { replace: true });
		});

		expect(getLocation().pathname).toBe("/settings");
	});

	it("Should preserve the number of entries When navigating with replace", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/about", "/contact"], 1);

		act(() => {
			getNavigate()("/settings", { replace: true });
		});

		expect(getLocation().pathname).toBe("/settings");
		act(() => {
			getNavigate()(-1);
		});
		expect(getLocation().pathname).toBe("/home");
	});

	it("Should generate a new key When navigating with push", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home"]);

		const initialKey = getLocation().key;

		act(() => {
			getNavigate()("/about");
		});

		expect(getLocation().key).not.toBe(initialKey);
	});

	it("Should update location When going back with navigate(-1)", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/about", "/contact"], 2);

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should update location When going forward with navigate(1)", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/about", "/contact"], 1);

		act(() => {
			getNavigate()(1);
		});

		expect(getLocation().pathname).toBe("/contact");
	});

	it("Should not change location When navigate(-1) at first entry", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/about"], 0);

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).toBe("/home");
	});

	it("Should not change location When navigate(1) at last entry", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/about"], 1);

		act(() => {
			getNavigate()(1);
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should move back two entries When navigate(-2) is called", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/a", "/b", "/c", "/d"], 3);

		act(() => {
			getNavigate()(-2);
		});

		expect(getLocation().pathname).toBe("/b");
	});

	it("Should move forward two entries When navigate(2) is called", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/a", "/b", "/c", "/d"], 1);

		act(() => {
			getNavigate()(2);
		});

		expect(getLocation().pathname).toBe("/d");
	});

	it("Should not change location When navigate(-5) exceeds bounds at start", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/a", "/b", "/c"], 1);

		act(() => {
			getNavigate()(-5);
		});

		expect(getLocation().pathname).toBe("/b");
	});

	it("Should not change location When navigate(5) exceeds bounds at end", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/a", "/b", "/c"], 1);

		act(() => {
			getNavigate()(5);
		});

		expect(getLocation().pathname).toBe("/b");
	});

	it("Should do nothing When navigate(0) is called", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home"]);

		act(() => {
			getNavigate()(0);
		});

		expect(getLocation().pathname).toBe("/home");
	});

	it("Should truncate forward entries When pushing after going back", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/about", "/contact"], 2);

		act(() => {
			getNavigate()(-2);
		});
		expect(getLocation().pathname).toBe("/home");

		act(() => {
			getNavigate()("/new-page");
		});
		expect(getLocation().pathname).toBe("/new-page");

		act(() => {
			getNavigate()(-1);
		});
		expect(getLocation().pathname).toBe("/home");

		act(() => {
			getNavigate()(1);
		});
		expect(getLocation().pathname).toBe("/new-page");

		act(() => {
			getNavigate()(1);
		});
		expect(getLocation().pathname).toBe("/new-page");
	});

	it("Should resolve relative '../sibling' path", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/users/42"]);

		act(() => {
			getNavigate()("../settings");
		});

		expect(getLocation().pathname).toBe("/users/settings");
	});

	it("Should resolve relative 'child' path", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/dashboard"]);

		act(() => {
			getNavigate()("child");
		});

		expect(getLocation().pathname).toBe("/dashboard/child");
	});

	it("Should update search When navigating to a query-only path", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/search"]);

		act(() => {
			getNavigate()("?q=test");
		});

		expect(getLocation().pathname).toBe("/search");
		expect(getLocation().search).toBe("?q=test");
	});

	it("Should update hash When navigating to a fragment-only path", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/page"]);

		act(() => {
			getNavigate()("#section");
		});

		expect(getLocation().pathname).toBe("/page");
		expect(getLocation().hash).toBe("#section");
	});

	it("Should resolve relative '..' path to parent", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/users/42/profile"]);

		act(() => {
			getNavigate()("..");
		});

		expect(getLocation().pathname).toBe("/users/42");
	});

	it("Should resolve relative path with replace option", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/users/42/profile", "/users/42/settings"], 0);

		act(() => {
			getNavigate()("..", { replace: true });
		});

		expect(getLocation().pathname).toBe("/users/42");

		act(() => {
			getNavigate()(1);
		});

		expect(getLocation().pathname).toBe("/users/42/settings");
	});

	it("Should pass state through push navigation", () => {
		const { getNavigate, getLocation } = renderMemoryRouter();

		act(() => {
			getNavigate()("/dashboard", { state: { from: "/login" } });
		});

		expect(getLocation().state).toEqual({ from: "/login" });
	});

	it("Should pass state through replace navigation", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home"]);

		act(() => {
			getNavigate()("/login", { state: { referrer: "/home" }, replace: true });
		});

		expect(getLocation().state).toEqual({ referrer: "/home" });
	});

	it("Should preserve state When navigating via delta to an entry pushed with state", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home"]);

		act(() => {
			getNavigate()("/about", { state: { detail: 42 } });
		});
		expect(getLocation().pathname).toBe("/about");
		expect(getLocation().state).toEqual({ detail: 42 });

		act(() => {
			getNavigate()(-1);
		});
		expect(getLocation().pathname).toBe("/home");

		act(() => {
			getNavigate()(1);
		});
		expect(getLocation().pathname).toBe("/about");
		expect(getLocation().state).toEqual({ detail: 42 });
	});

	it("Should strip basename from initial entries", () => {
		const { getLocation } = renderMemoryRouter(["/app/users/42"], undefined, "/app");

		expect(getLocation().pathname).toBe("/users/42");
	});

	it("Should return '/' When pathname equals basename exactly", () => {
		const { getLocation } = renderMemoryRouter(["/app"], undefined, "/app");

		expect(getLocation().pathname).toBe("/");
	});

	it("Should not strip basename When segment boundary does not match", () => {
		const { getLocation } = renderMemoryRouter(["/appp/users"], undefined, "/app");

		expect(getLocation().pathname).toBe("/appp/users");
	});

	it("Should strip basename with trailing slash correctly", () => {
		const { getLocation } = renderMemoryRouter(["/app/users"], undefined, "/app/");

		expect(getLocation().pathname).toBe("/users");
	});

	it("Should resolve relative navigation against basename-stripped pathname", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/app/dashboard"], undefined, "/app");

		act(() => {
			getNavigate()("child");
		});

		expect(getLocation().pathname).toBe("/dashboard/child");
	});

	it("Should preserve search and hash When stripping basename", () => {
		const { getLocation } = renderMemoryRouter(["/app/dashboard?tab=1#top"], undefined, "/app");

		expect(getLocation().pathname).toBe("/dashboard");
		expect(getLocation().search).toBe("?tab=1");
		expect(getLocation().hash).toBe("#top");
	});

	it("Should produce normalized href from Link When basename has trailing slash", () => {
		rtlRender(
			<MemoryRouter basename="/app/">
				<Link to="/users">Users</Link>
			</MemoryRouter>,
		);

		const anchor = screen.getByRole("link", { name: "Users" });
		expect(anchor.getAttribute("href")).toBe("/app/users");
	});

	it("Should block navigation When a blocker is active during push", () => {
		const { getNavigate, getLocation } = renderWithBlocker(true);

		act(() => {
			getNavigate()("/about");
		});

		expect(getLocation().pathname).toBe("/");
	});

	it("Should not block navigation When no blocker is active during push", () => {
		const { getNavigate, getLocation } = renderWithBlocker(false);

		act(() => {
			getNavigate()("/about");
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should block delta navigation When a blocker is active", () => {
		const { getNavigate, getLocation } = renderWithBlocker(true, ["/home", "/about"], 1);

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should not block delta navigation When no blocker is active", () => {
		const { getNavigate, getLocation } = renderWithBlocker(false, ["/home", "/about"], 1);

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).toBe("/home");
	});

	it("Should pass push action to onBlock When blocking a string navigation", () => {
		const onBlockSpy = vi.fn();
		const registration = {
			isBlocking: () => true,
			onBlock: onBlockSpy,
		};

		const { getNavigate, getBlockerRegistry } = renderMemoryRouter();
		getBlockerRegistry().register(registration);

		act(() => {
			getNavigate()("/about");
		});

		expect(onBlockSpy).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/about" }), undefined, { type: "push" });

		getBlockerRegistry().unregister(registration);
	});

	it("Should pass replace action to onBlock When blocking a replace navigation", () => {
		const onBlockSpy = vi.fn();
		const registration = {
			isBlocking: () => true,
			onBlock: onBlockSpy,
		};

		const { getNavigate, getBlockerRegistry } = renderMemoryRouter();
		getBlockerRegistry().register(registration);

		act(() => {
			getNavigate()("/login", { replace: true });
		});

		expect(onBlockSpy).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/login" }), expect.objectContaining({ replace: true }), {
			type: "replace",
		});

		getBlockerRegistry().unregister(registration);
	});

	it("Should pass delta action to onBlock When blocking a delta navigation", () => {
		const onBlockSpy = vi.fn();
		const registration = {
			isBlocking: () => true,
			onBlock: onBlockSpy,
		};

		const { getNavigate, getBlockerRegistry } = renderMemoryRouter(["/home", "/about"], 1);
		getBlockerRegistry().register(registration);

		act(() => {
			getNavigate()(-1);
		});

		expect(onBlockSpy).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/home" }), expect.objectContaining({ state: undefined }), {
			type: "delta",
			delta: -1,
		});

		getBlockerRegistry().unregister(registration);
	});

	it("Should move history pointer When proceed is called after blocking a delta navigation", () => {
		const { getBlocker, getLocation, getNavigate } = renderWithCapturingBlocker(true);

		expect(getLocation().pathname).toBe("/about");

		act(() => {
			getNavigate()(-1);
		});

		expect(getBlocker().isBlocking).toBe(true);
		expect(getLocation().pathname).toBe("/about");

		act(() => {
			getBlocker().proceed();
		});

		expect(getLocation().pathname).toBe("/home");
	});

	it("Should not create a new history entry When proceed is called after blocking a delta navigation", () => {
		let blocking = true;
		const shouldBlock = () => blocking;
		const { getBlocker, getLocation, getNavigate } = renderWithCapturingBlocker(shouldBlock);

		act(() => {
			getNavigate()(-1);
		});

		expect(getBlocker().isBlocking).toBe(true);

		act(() => {
			getBlocker().proceed();
		});

		expect(getLocation().pathname).toBe("/home");

		blocking = false;

		act(() => {
			getNavigate()(1);
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should push a new entry When proceed is called after blocking a string navigation", () => {
		let blocking = true;
		const shouldBlock = () => blocking;
		const { getBlocker, getLocation, getNavigate } = renderWithCapturingBlocker(shouldBlock);

		act(() => {
			getNavigate()("/contact");
		});

		expect(getBlocker().isBlocking).toBe(true);

		act(() => {
			getBlocker().proceed();
		});

		expect(getLocation().pathname).toBe("/contact");

		blocking = false;

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should reset and not navigate When reset is called after blocking", () => {
		const { getBlocker, getLocation, getNavigate } = renderWithCapturingBlocker(true);

		act(() => {
			getNavigate()("/contact");
		});

		expect(getBlocker().isBlocking).toBe(true);

		act(() => {
			getBlocker().reset();
		});

		expect(getLocation().pathname).toBe("/about");
	});

	it("Should pass push action to context-aware blocker When navigating via string", () => {
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

	it("Should pass replace action to context-aware blocker When navigating with replace", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		const { getNavigate, getLocation } = renderWithContextAwareBlocker(spy);

		act(() => {
			getNavigate()("/profile", { replace: true });
		});

		expect(getLocation().pathname).toBe("/profile");
		expect(spy).toHaveBeenCalledWith({
			nextLocation: expect.objectContaining({ pathname: "/profile" }),
			options: expect.objectContaining({ replace: true }),
			action: { type: "replace" },
		});
	});

	it("Should pass delta action to context-aware blocker When navigating via number", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		const { getNavigate, getLocation } = renderWithContextAwareBlocker(spy, ["/home", "/about"], 1);

		const initialPath = getLocation().pathname;

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).not.toBe(initialPath);
		expect(spy).toHaveBeenCalledWith(
			expect.objectContaining({
				nextLocation: expect.objectContaining({ pathname: "/home" }),
				action: { type: "delta", delta: -1 },
			}),
		);
	});

	it("Should block selectively When context-aware blocker inspects action type", () => {
		const spy = vi.fn((ctx: BlockerContext) => ctx.action.type === "replace");

		const { getNavigate, getLocation } = renderWithContextAwareBlocker(spy);

		act(() => {
			getNavigate()("/allowed");
		});

		expect(getLocation().pathname).toBe("/allowed");

		act(() => {
			getNavigate()("/blocked", { replace: true });
		});

		expect(getLocation().pathname).toBe("/allowed");
	});

	it("Should call raw navigate with delta When useNavigate is used with a negative number", () => {
		const { getNavigate, getLocation } = renderWithNavigateHook(["/home", "/about"]);

		act(() => {
			getNavigate()(-1);
		});

		expect(getLocation().pathname).toBe("/home");
	});

	it("Should call raw navigate with delta When useNavigate is used with a positive number", () => {
		const { getNavigate, getLocation } = renderWithNavigateHook(["/home", "/about", "/contact"]);

		act(() => {
			getNavigate()(2);
		});

		expect(getLocation().pathname).toBe("/contact");
	});

	it("Should default to '/' When initialEntries is an empty array", () => {
		const { getLocation } = renderMemoryRouter([]);

		expect(getLocation().pathname).toBe("/");
	});

	it("Should include search and hash in the location When navigating to a path with query and fragment", () => {
		const { getNavigate, getLocation } = renderMemoryRouter();

		act(() => {
			getNavigate()("/search?q=test#results");
		});

		expect(getLocation().pathname).toBe("/search");
		expect(getLocation().search).toBe("?q=test");
		expect(getLocation().hash).toBe("#results");
	});

	it("Should keep search and hash When using delta navigation to an entry that has them", () => {
		const { getNavigate, getLocation } = renderMemoryRouter(["/home", "/search?q=test#results"], 0);

		act(() => {
			getNavigate()(1);
		});

		expect(getLocation().pathname).toBe("/search");
		expect(getLocation().search).toBe("?q=test");
		expect(getLocation().hash).toBe("#results");
	});

	it("Should include key in the location returned by useLocation", () => {
		const { getLocation } = renderMemoryRouter();

		expect(getLocation().key).toBeDefined();
		expect(typeof getLocation().key).toBe("string");
	});

	it("Should decode Unicode characters in pathname When navigating to a non-ASCII path", () => {
		const { getNavigate, getLocation } = renderMemoryRouter();

		act(() => {
			getNavigate()("/niño");
		});

		expect(getLocation().pathname).toBe("/niño");
	});

	it("Should decode pathname but keep search and hash percent-encoded When navigating to a non-ASCII path with query and fragment", () => {
		const { getNavigate, getLocation } = renderMemoryRouter();

		act(() => {
			getNavigate()("/search?q=café#sección");
		});

		expect(getLocation().pathname).toBe("/search");
		expect(getLocation().search).toBe("?q=caf%C3%A9");
		expect(getLocation().hash).toBe("#secci%C3%B3n");
	});

	it("Should navigate without crashing When the target path contains a literal '%'", () => {
		const { getNavigate, getLocation } = renderMemoryRouter();

		act(() => {
			getNavigate()("/products/50%");
		});

		expect(getLocation().pathname).toBe("/products/50%");
	});
});

describe("Blocker isolation between router instances", () => {
	let navigateA: NavigateFunction | null = null;
	let locationA: Location | null = null;
	let navigateB: NavigateFunction | null = null;
	let locationB: Location | null = null;

	beforeEach(() => {
		navigateA = null;
		locationA = null;
		navigateB = null;
		locationB = null;
	});

	const BlockAndCaptureA = () => {
		useBlocker(true);
		navigateA = useContext(NavigatorContext);
		locationA = useLocation();
		return null;
	};

	const CaptureB = () => {
		navigateB = useContext(NavigatorContext);
		locationB = useLocation();
		return null;
	};

	it("Should NOT block Router B navigation When blocker is active in Router A", () => {
		rtlRender(
			<>
				<MemoryRouter initialEntries={["/a1", "/a2"]} initialIndex={0}>
					<BlockAndCaptureA />
				</MemoryRouter>
				<MemoryRouter initialEntries={["/b"]}>
					<CaptureB />
				</MemoryRouter>
			</>,
		);

		act(() => {
			navigateB!("/target");
		});

		expect(locationB!.pathname).toBe("/target");
	});

	it("Should block Router A navigation While Router B navigates freely", () => {
		rtlRender(
			<>
				<MemoryRouter initialEntries={["/a"]}>
					<BlockAndCaptureA />
				</MemoryRouter>
				<MemoryRouter initialEntries={["/b"]}>
					<CaptureB />
				</MemoryRouter>
			</>,
		);

		act(() => {
			navigateB!("/target-b");
		});

		expect(locationB!.pathname).toBe("/target-b");

		act(() => {
			navigateA!("/target-a");
		});

		expect(locationA!.pathname).toBe("/a");
	});

	it("Should NOT leak blockers after router unmounts", () => {
		const { unmount } = rtlRender(
			<MemoryRouter>
				<BlockAndCaptureA />
			</MemoryRouter>,
		);

		unmount();

		rtlRender(
			<MemoryRouter initialEntries={["/b"]}>
				<CaptureB />
			</MemoryRouter>,
		);

		act(() => {
			navigateB!("/target");
		});

		expect(locationB!.pathname).toBe("/target");
	});
});
