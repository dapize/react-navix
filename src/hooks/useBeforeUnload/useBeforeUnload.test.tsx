import { render as rtlRender } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlockerContext, BlockerFunction } from "../useResolvedBlocker";
import { useBeforeUnload } from "./useBeforeUnload";

const TestHarness = ({ shouldBlock }: { shouldBlock: BlockerFunction }) => {
	useBeforeUnload(shouldBlock);
	return null;
};

describe("useBeforeUnload", () => {
	let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
	let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

	const getCapturedHandler = (): ((event: Event) => void) | null => {
		const calls = addEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === "beforeunload");
		if (calls.length === 0) return null;
		return calls[calls.length - 1][1] as (event: Event) => void;
	};

	const getHandlerCount = (): number => {
		return addEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === "beforeunload").length;
	};

	const getRemovedHandler = (): ((event: Event) => void) | null => {
		const calls = removeEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === "beforeunload");
		if (calls.length === 0) return null;
		return calls[calls.length - 1][1] as (event: Event) => void;
	};

	const getRemovalCount = (): number => {
		return removeEventListenerSpy.mock.calls.filter((call: unknown[]) => call[0] === "beforeunload").length;
	};

	beforeEach(() => {
		addEventListenerSpy = vi.spyOn(window, "addEventListener");
		removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
	});

	afterEach(() => {
		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
	});

	it("Should register beforeunload listener When shouldBlock is true", () => {
		rtlRender(<TestHarness shouldBlock={true} />);

		expect(getHandlerCount()).toBe(1);
	});

	it("Should not register beforeunload listener When shouldBlock is false", () => {
		rtlRender(<TestHarness shouldBlock={false} />);

		expect(getHandlerCount()).toBe(0);
	});

	it("Should call preventDefault and set returnValue When handler fires and shouldBlock is true", () => {
		rtlRender(<TestHarness shouldBlock={true} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		handler!(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(event.returnValue).toBe(true);
	});

	it("Should not call preventDefault When handler fires and shouldBlock is false", () => {
		rtlRender(<TestHarness shouldBlock={false} />);

		expect(getHandlerCount()).toBe(0);
	});

	it("Should remove listener on unmount", () => {
		const { unmount } = rtlRender(<TestHarness shouldBlock={true} />);

		expect(getHandlerCount()).toBe(1);

		unmount();

		expect(getRemovalCount()).toBe(1);
	});

	it("Should remove the same handler function When listener is cleaned up", () => {
		const { unmount } = rtlRender(<TestHarness shouldBlock={true} />);

		const addedHandler = getCapturedHandler();
		expect(addedHandler).not.toBeNull();

		unmount();

		const removedHandler = getRemovedHandler();
		expect(removedHandler).not.toBeNull();
		expect(removedHandler).toBe(addedHandler);
	});

	it("Should register listener When shouldBlock transitions from false to true", () => {
		const { rerender } = rtlRender(<TestHarness shouldBlock={false} />);

		expect(getHandlerCount()).toBe(0);

		rerender(<TestHarness shouldBlock={true} />);

		expect(getHandlerCount()).toBe(1);
	});

	it("Should remove listener When shouldBlock transitions from true to false", () => {
		const { rerender } = rtlRender(<TestHarness shouldBlock={true} />);

		expect(getHandlerCount()).toBe(1);
		expect(getRemovalCount()).toBe(0);

		rerender(<TestHarness shouldBlock={false} />);

		expect(getRemovalCount()).toBe(1);
	});

	it("Should evaluate callback function on each beforeunload event", () => {
		let flag = true;
		const shouldBlockFn = () => flag;

		const { rerender } = rtlRender(<TestHarness shouldBlock={shouldBlockFn} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		handler!(event);
		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(event.returnValue).toBe(true);

		flag = false;
		rerender(<TestHarness shouldBlock={shouldBlockFn} />);

		const event2 = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy2 = vi.spyOn(event2, "preventDefault");

		handler!(event2);
		expect(preventDefaultSpy2).not.toHaveBeenCalled();
	});

	it("Should set returnValue to true When handler blocks", () => {
		rtlRender(<TestHarness shouldBlock={true} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		handler!(event);

		expect(event.returnValue).toBe(true);
	});

	it("Should not block When callback returns false but listener was registered with true", () => {
		let flag = true;

		const { rerender } = rtlRender(<TestHarness shouldBlock={() => flag} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		flag = false;
		rerender(<TestHarness shouldBlock={() => flag} />);

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		handler!(event);

		expect(preventDefaultSpy).not.toHaveBeenCalled();
	});

	it("Should call context-aware callback with default context on beforeunload", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		rtlRender(<TestHarness shouldBlock={spy} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		handler!(event);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith({
			nextLocation: { pathname: "", search: "", hash: "" },
			action: { type: "push" },
		});
	});

	it("Should block beforeunload When context-aware callback returns true", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		rtlRender(<TestHarness shouldBlock={spy} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		handler!(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(event.returnValue).toBe(true);
	});

	it("Should not block beforeunload When context-aware callback returns false", () => {
		const spy = vi.fn((_ctx: BlockerContext) => false);

		rtlRender(<TestHarness shouldBlock={spy} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		handler!(event);

		expect(preventDefaultSpy).not.toHaveBeenCalled();
	});

	it("Should evaluate context-aware callback on each beforeunload event via ref", () => {
		let flag = true;
		const spy = vi.fn((_ctx: BlockerContext) => flag);

		const { rerender } = rtlRender(<TestHarness shouldBlock={spy} />);

		const handler = getCapturedHandler();
		expect(handler).not.toBeNull();

		const event = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		handler!(event);
		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(event.returnValue).toBe(true);

		flag = false;
		rerender(<TestHarness shouldBlock={spy} />);

		const event2 = new Event("beforeunload") as BeforeUnloadEvent;
		const preventDefaultSpy2 = vi.spyOn(event2, "preventDefault");

		handler!(event2);
		expect(preventDefaultSpy2).not.toHaveBeenCalled();
	});

	it("Should not call context-aware callback during init", () => {
		const spy = vi.fn((_ctx: BlockerContext) => true);

		rtlRender(<TestHarness shouldBlock={spy} />);

		expect(spy).not.toHaveBeenCalled();
	});
});
