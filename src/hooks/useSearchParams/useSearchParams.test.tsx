import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../test-utils";
import { type UseSearchParamsReturn, useSearchParams } from "./useSearchParams";

let hookResult: UseSearchParamsReturn | null = null;

const TestHarness = () => {
	hookResult = useSearchParams();
	return null;
};

describe("useSearchParams", () => {
	beforeEach(() => {
		hookResult = null;
	});

	it("Should parse query params from location.search", () => {
		hookResult = null;
		render(<TestHarness />, { location: { pathname: "/posts", search: "?page=3&status=published", hash: "" } });

		expect(hookResult![0].get("page")).toBe("3");
		expect(hookResult![0].get("status")).toBe("published");
	});

	it("Should return empty URLSearchParams When no query string exists", () => {
		hookResult = null;
		render(<TestHarness />, { location: { pathname: "/posts", search: "", hash: "" } });

		expect(hookResult![0].toString()).toBe("");
	});

	it("Should build new URL with query params on setSearchParams", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/posts", search: "", hash: "" }, navigate: navigateMock });

		hookResult![1]({ page: "4", status: "draft" });

		expect(navigateMock).toHaveBeenCalledWith("/posts?page=4&status=draft", undefined);
	});

	it("Should preserve existing pathname When calling setSearchParams", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/dashboard/admin", search: "", hash: "" }, navigate: navigateMock });

		hookResult![1]({ tab: "users" });

		expect(navigateMock).toHaveBeenCalledWith("/dashboard/admin?tab=users", undefined);
	});

	it("Should call navigate with replace When options.replace is true", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/posts", search: "", hash: "" }, navigate: navigateMock });

		hookResult![1]({ page: "5" }, { replace: true });

		expect(navigateMock).toHaveBeenCalledWith("/posts?page=5", { replace: true });
	});

	it("Should clear params When empty object is passed", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/posts", search: "?page=3", hash: "" }, navigate: navigateMock });

		hookResult![1]({});

		expect(navigateMock).toHaveBeenCalledWith("/posts", undefined);
	});

	it("Should accept URLSearchParams instance on setSearchParams", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/search", search: "", hash: "" }, navigate: navigateMock });

		const next = new URLSearchParams();
		next.append("q", "hello");
		next.append("tag", "react");
		next.append("tag", "router");
		hookResult![1](next);

		expect(navigateMock).toHaveBeenCalledWith("/search?q=hello&tag=react&tag=router", undefined);
	});

	it("Should preserve location.hash When calling setSearchParams", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/docs", search: "?page=1", hash: "#installation" }, navigate: navigateMock });

		hookResult![1]({ page: "5" });

		expect(navigateMock).toHaveBeenCalledWith("/docs?page=5#installation", undefined);
	});

	it("Should preserve empty hash as empty string", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, { location: { pathname: "/posts", search: "", hash: "" }, navigate: navigateMock });

		hookResult![1]({ page: "3" });

		expect(navigateMock).toHaveBeenCalledWith("/posts?page=3", undefined);
	});

	it("Should remove params by omitting keys from the new object", () => {
		const navigateMock = vi.fn();
		hookResult = null;

		render(<TestHarness />, {
			location: { pathname: "/posts", search: "?page=3&status=published&tag=react", hash: "" },
			navigate: navigateMock,
		});

		hookResult![1]({ page: "5" });

		expect(navigateMock).toHaveBeenCalledWith("/posts?page=5", undefined);
	});
});
