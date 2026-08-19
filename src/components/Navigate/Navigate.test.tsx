import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";

import { render } from "../../test-utils";
import { Navigate } from "./Navigate";

describe("Navigate", () => {
	it("Should call navigate with the target path on mount", () => {
		const navigate = vi.fn();
		render(<Navigate to="/login" />, { navigate });

		expect(navigate).toHaveBeenCalledWith("/login", { replace: true, relative: "route" });
	});

	it("Should call navigate with replace When replace prop is true", () => {
		const navigate = vi.fn();
		render(<Navigate to="/login" replace />, { navigate });

		expect(navigate).toHaveBeenCalledWith("/login", { replace: true, relative: "route" });
	});

	it("Should render null (no DOM output)", () => {
		const { container } = render(<Navigate to="/dashboard" />);

		expect(container.firstChild).toBeNull();
	});

	it("Should resolve '..' and call navigate with absolute resolved path", () => {
		const navigate = vi.fn();
		render(<Navigate to=".." />, { navigate, location: { pathname: "/users/42", search: "", hash: "" } });

		expect(navigate).toHaveBeenCalledWith("/users", { replace: true, relative: "route" });
	});

	it("Should resolve child segment and call navigate with replace option", () => {
		const navigate = vi.fn();
		render(<Navigate to="child" replace />, {
			navigate,
			location: { pathname: "/users/42", search: "", hash: "" },
		});

		expect(navigate).toHaveBeenCalledWith("/users/42/child", { replace: true, relative: "route" });
	});

	it("Should not modify absolute path When to starts with '/'", () => {
		const navigate = vi.fn();
		render(<Navigate to="/absolute" />, { navigate, location: { pathname: "/users/42", search: "", hash: "" } });

		expect(navigate).toHaveBeenCalledWith("/absolute", { replace: true, relative: "route" });
	});

	it("Should call navigate with resolved path and relative option When relative is 'route'", () => {
		const navigate = vi.fn();
		render(<Navigate to="../settings" relative="route" />, {
			navigate,
			location: { pathname: "/users/42", search: "", hash: "" },
		});

		expect(navigate).toHaveBeenCalledWith("/users/settings", { replace: true, relative: "route" });
	});

	it("Should call navigate with resolved path against currentPathname When relative is 'path'", () => {
		const navigate = vi.fn();
		render(<Navigate to=".." relative="path" />, {
			navigate,
			location: { pathname: "/app/dashboard", search: "", hash: "" },
			routeBase: "/users/42",
		});

		expect(navigate).toHaveBeenCalledWith("/app", { replace: true, relative: "path" });
	});

	it("Should navigate only once When mounted in StrictMode", () => {
		const navigate = vi.fn();
		render(
			<StrictMode>
				<Navigate to="/login" />
			</StrictMode>,
			{ navigate },
		);

		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it("Should navigate again When to prop changes after first navigation", () => {
		const navigate = vi.fn();
		const { rerender } = render(<Navigate to="/login" />, { navigate });

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith("/login", { replace: true, relative: "route" });

		rerender(<Navigate to="/dashboard" />);

		expect(navigate).toHaveBeenCalledTimes(2);
		expect(navigate).toHaveBeenLastCalledWith("/dashboard", { replace: true, relative: "route" });
	});

	it("Should navigate again When replace prop changes after first navigation", () => {
		const navigate = vi.fn();
		const { rerender } = render(<Navigate to="/login" />, { navigate });

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith("/login", { replace: true, relative: "route" });

		rerender(<Navigate to="/login" replace={false} />);

		expect(navigate).toHaveBeenCalledTimes(2);
		expect(navigate).toHaveBeenLastCalledWith("/login", { replace: false, relative: "route" });
	});

	it("Should navigate again When relative prop changes after first navigation", () => {
		const navigate = vi.fn();
		const { rerender } = render(<Navigate to=".." relative="route" />, {
			navigate,
			location: { pathname: "/app/dashboard", search: "", hash: "" },
			routeBase: "/users/42",
		});

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith("/users", { replace: true, relative: "route" });

		rerender(<Navigate to=".." relative="path" />);

		expect(navigate).toHaveBeenCalledTimes(2);
		expect(navigate).toHaveBeenLastCalledWith("/app", { replace: true, relative: "path" });
	});

	it("Should pass state to navigate When state prop is provided", () => {
		const navigate = vi.fn();
		render(<Navigate to="/login" state={{ from: "/home" }} />, { navigate });

		expect(navigate).toHaveBeenCalledWith("/login", { replace: true, relative: "route", state: { from: "/home" } });
	});

	it("Should navigate again When state prop changes after first navigation", () => {
		const navigate = vi.fn();
		const { rerender } = render(<Navigate to="/login" state={{ step: 1 }} />, { navigate });

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith("/login", { replace: true, relative: "route", state: { step: 1 } });

		rerender(<Navigate to="/login" state={{ step: 2 }} />);

		expect(navigate).toHaveBeenCalledTimes(2);
		expect(navigate).toHaveBeenLastCalledWith("/login", { replace: true, relative: "route", state: { step: 2 } });
	});

	it("Should not navigate again When state prop stays the same reference", () => {
		const navigate = vi.fn();
		const state = { step: 1 };
		const { rerender } = render(<Navigate to="/login" state={state} />, { navigate });

		expect(navigate).toHaveBeenCalledTimes(1);

		rerender(<Navigate to="/login" state={state} />);

		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it("Should not navigate again When state is a new object with the same content", () => {
		const navigate = vi.fn();
		const { rerender } = render(<Navigate to="/login" state={{ step: 1 }} />, { navigate });

		expect(navigate).toHaveBeenCalledTimes(1);

		rerender(<Navigate to="/login" state={{ step: 1 }} />);

		expect(navigate).toHaveBeenCalledTimes(1);
	});

	it("Should navigate again When a nested state value changes", () => {
		const navigate = vi.fn();
		const { rerender } = render(<Navigate to="/login" state={{ user: { id: 1 } }} />, { navigate });

		expect(navigate).toHaveBeenCalledTimes(1);

		rerender(<Navigate to="/login" state={{ user: { id: 2 } }} />);

		expect(navigate).toHaveBeenCalledTimes(2);
	});
});
