import { act, render as rtlRender } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "../../test-utils";
import { useNavigate } from "./useNavigate";

let hookResult: ReturnType<typeof useNavigate> | null = null;

const TestHarness = () => {
	hookResult = useNavigate();
	return null;
};

describe("useNavigate", () => {
	beforeEach(() => {
		hookResult = null;
	});

	it("Should resolve absolute path unchanged and call rawNavigate", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock });

		act(() => {
			hookResult!("/absolute");
		});

		expect(navigateMock).toHaveBeenCalledWith("/absolute", undefined);
	});

	it("Should resolve '..' against current pathname and call rawNavigate with resolved path", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!("..");
		});

		expect(navigateMock).toHaveBeenCalledWith("/users", undefined);
	});

	it("Should resolve '..' against routeBase When relative is 'route'", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, {
			navigate: navigateMock,
			location: { pathname: "/files/images/cat.jpg", search: "", hash: "" },
			routeBase: "/files",
		});

		act(() => {
			hookResult!("..", { relative: "route" });
		});

		expect(navigateMock).toHaveBeenCalledWith("/", { relative: "route" });
	});

	it("Should fall back to pathname When relative is 'route' but routeBase is empty", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!("..", { relative: "route" });
		});

		expect(navigateMock).toHaveBeenCalledWith("/users", { relative: "route" });
	});

	it("Should pass replace option through to rawNavigate", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!("../settings", { replace: true });
		});

		expect(navigateMock).toHaveBeenCalledWith("/users/settings", { replace: true });
	});

	it("Should throw When called outside a Router (no provider)", () => {
		rtlRender(<TestHarness />);

		expect(() => hookResult!("/foo")).toThrow("useNavigate() must be used within a Router component.");
	});

	it("Should pass negative delta directly to rawNavigate without resolving", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!(-1);
		});

		expect(navigateMock).toHaveBeenCalledWith(-1, undefined);
	});

	it("Should pass positive delta directly to rawNavigate", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!(1);
		});

		expect(navigateMock).toHaveBeenCalledWith(1, undefined);
	});

	it("Should pass negative delta with options to rawNavigate", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!(-1, { replace: true });
		});

		expect(navigateMock).toHaveBeenCalledWith(-1, { replace: true });
	});

	it("Should pass delta zero to rawNavigate", () => {
		const navigateMock = vi.fn();

		render(<TestHarness />, { navigate: navigateMock, location: { pathname: "/users/42", search: "", hash: "" } });

		act(() => {
			hookResult!(0);
		});

		expect(navigateMock).toHaveBeenCalledWith(0, undefined);
	});
});
