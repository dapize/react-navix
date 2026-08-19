import { describe, expect, it, vi } from "vitest";

import { createLocationStore } from "./location";

describe("createLocationStore", () => {
	it("Should return the initial location from getSnapshot", () => {
		const store = createLocationStore({ pathname: "/home", search: "?q=1", hash: "#top" }, "");

		expect(store.getSnapshot()).toEqual({ pathname: "/home", search: "?q=1", hash: "#top" });
	});

	it("Should return the same reference from getSnapshot until location changes", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		const first = store.getSnapshot();

		store.setLocation({ pathname: "/about", search: "", hash: "" });
		const second = store.getSnapshot();

		expect(first).not.toBe(second);
	});

	it("Should notify subscribers When setLocation is called with different values", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/about", search: "", hash: "" });

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("Should not notify subscribers When setLocation is called with the same values", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/home", search: "", hash: "" });

		expect(listener).not.toHaveBeenCalled();
	});

	it("Should notify subscribers When setLocation is called with same pathname/search/hash/state but different key", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "", key: "old" }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/home", search: "", hash: "", key: "new" });

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("Should not notify subscribers after they unsubscribe", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		const listener = vi.fn();

		const unsubscribe = store.subscribe(listener);
		unsubscribe();

		store.setLocation({ pathname: "/about", search: "", hash: "" });

		expect(listener).not.toHaveBeenCalled();
	});

	it("Should notify subscribers When setLocation is called with different state but same pathname", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/home", search: "", hash: "", state: { from: "/login" } });

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("Should not notify subscribers When setLocation is called with same state reference", () => {
		const state = { from: "/login" };
		const store = createLocationStore({ pathname: "/home", search: "", hash: "", state }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/home", search: "", hash: "", state });

		expect(listener).not.toHaveBeenCalled();
	});

	it("Should notify subscribers When state changes from undefined to a value", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "" }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/home", search: "", hash: "", state: { data: 42 } });

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("Should notify subscribers When state changes from a value to undefined", () => {
		const store = createLocationStore({ pathname: "/home", search: "", hash: "", state: { data: 42 } }, "");
		const listener = vi.fn();

		store.subscribe(listener);
		store.setLocation({ pathname: "/home", search: "", hash: "" });

		expect(listener).toHaveBeenCalledTimes(1);
	});
});
