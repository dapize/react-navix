import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../test-utils";
import { Link } from "./Link";

describe("Link", () => {
	it("Should render an anchor with the correct href", () => {
		render(<Link to="/about">Click me</Link>);

		const anchor = screen.getByRole("link");
		expect(anchor).toHaveAttribute("href", "/about");
	});

	it("Should prepend the router prefix to href When under HashRouter", () => {
		render(<Link to="/dashboard">Click me</Link>, { prefix: "#" });

		const anchor = screen.getByRole("link");
		expect(anchor).toHaveAttribute("href", "#/dashboard");
	});

	it("Should call navigate with the target path When clicked", async () => {
		const navigate = vi.fn();
		render(<Link to="/posts">Click me</Link>, { navigate });

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/posts", { replace: false, relative: "route" });
	});

	it("Should call navigate with replace When replace prop is true", async () => {
		const navigate = vi.fn();
		render(
			<Link to="/posts" replace>
				Click me
			</Link>,
			{ navigate },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/posts", { replace: true, relative: "route" });
	});

	it("Should call the user's onClick handler When the link is clicked", async () => {
		const onClick = vi.fn();
		render(
			<Link to="/posts" onClick={onClick}>
				Click me
			</Link>,
			{ navigate: vi.fn() },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it("Should not navigate When the user's onClick handler calls preventDefault", async () => {
		const navigate = vi.fn();
		render(
			<Link
				to="/posts"
				onClick={(event) => {
					event.preventDefault();
				}}
			>
				Click me
			</Link>,
			{ navigate },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should not prevent default When Ctrl key is held", async () => {
		const navigate = vi.fn();
		render(<Link to="/posts">Click me</Link>, { navigate });

		const user = userEvent.setup();
		await user.keyboard("{Control>}");
		await user.click(screen.getByRole("link"));
		await user.keyboard("{/Control}");

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should not prevent default When Meta key is held", async () => {
		const navigate = vi.fn();
		render(<Link to="/posts">Click me</Link>, { navigate });

		const user = userEvent.setup();
		await user.keyboard("{Meta>}");
		await user.click(screen.getByRole("link"));
		await user.keyboard("{/Meta}");

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should not prevent default When Alt key is held", async () => {
		const navigate = vi.fn();
		render(<Link to="/posts">Click me</Link>, { navigate });

		const user = userEvent.setup();
		await user.keyboard("{Alt>}");
		await user.click(screen.getByRole("link"));
		await user.keyboard("{/Alt}");

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should not prevent default When Shift key is held", async () => {
		const navigate = vi.fn();
		render(<Link to="/posts">Click me</Link>, { navigate });

		const user = userEvent.setup();
		await user.keyboard("{Shift>}");
		await user.click(screen.getByRole("link"));
		await user.keyboard("{/Shift}");

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should pass through additional anchor attributes", () => {
		render(
			<Link to="/about" className="custom-link">
				Click me
			</Link>,
		);

		expect(screen.getByRole("link")).toHaveClass("custom-link");
	});

	it("Should not prevent default When target is _blank", async () => {
		const navigate = vi.fn();
		render(
			<Link to="/external" target="_blank">
				Click me
			</Link>,
			{ navigate },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should not navigate When middle mouse button is clicked", async () => {
		const navigate = vi.fn();
		render(<Link to="/posts">Click me</Link>, { navigate });

		const user = userEvent.setup();
		await user.pointer({ keys: "[MouseMiddle]", target: screen.getByRole("link") });

		expect(navigate).not.toHaveBeenCalled();
	});

	it("Should resolve '..' and render the correct href When to is relative", () => {
		render(<Link to="..">Click me</Link>, { location: { pathname: "/users/42", search: "", hash: "" } });

		expect(screen.getByRole("link")).toHaveAttribute("href", "/users");
	});

	it("Should call navigate with resolved absolute path When clicked with relative to", async () => {
		const navigate = vi.fn();
		render(<Link to="../settings">Click me</Link>, { navigate, location: { pathname: "/users/42", search: "", hash: "" } });

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/users/settings", { replace: false, relative: "route" });
	});

	it("Should call navigate with resolved child path When to is a plain segment", async () => {
		const navigate = vi.fn();
		render(<Link to="edit">Click me</Link>, { navigate, location: { pathname: "/users/42", search: "", hash: "" } });

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/users/42/edit", { replace: false, relative: "route" });
	});

	it("Should not modify absolute path When to starts with '/'", async () => {
		const navigate = vi.fn();
		render(<Link to="/absolute">Click me</Link>, { navigate, location: { pathname: "/users/42", search: "", hash: "" } });

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/absolute", { replace: false, relative: "route" });
	});

	it("Should resolve relative path with HashRouter prefix in href", () => {
		render(<Link to="..">Click me</Link>, { prefix: "#", location: { pathname: "/users/42", search: "", hash: "" } });

		expect(screen.getByRole("link")).toHaveAttribute("href", "#/users");
	});

	it("Should resolve href against routeBase When relative is 'route'", () => {
		render(
			<Link to=".." relative="route">
				Click me
			</Link>,
			{ routeBase: "/users/42" },
		);

		expect(screen.getByRole("link")).toHaveAttribute("href", "/users");
	});

	it("Should resolve href against location.pathname When relative is 'path'", () => {
		render(
			<Link to=".." relative="path">
				Click me
			</Link>,
			{ location: { pathname: "/users/42", search: "", hash: "" }, routeBase: "/admin/dashboard" },
		);

		expect(screen.getByRole("link")).toHaveAttribute("href", "/users");
	});

	it("Should call navigate with resolved path against pathname When relative is 'path'", async () => {
		const navigate = vi.fn();
		render(
			<Link to=".." relative="path">
				Click me
			</Link>,
			{ navigate, location: { pathname: "/users/42", search: "", hash: "" }, routeBase: "/admin/dashboard" },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/users", { replace: false, relative: "path" });
	});

	it("Should call navigate with resolved path and relative option When relative is 'route'", async () => {
		const navigate = vi.fn();
		render(
			<Link to="../settings" relative="route">
				Click me
			</Link>,
			{ navigate, routeBase: "/users/42" },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/users/settings", { replace: false, relative: "route" });
	});

	it("Should pass state to navigate When clicked with state prop", async () => {
		const navigate = vi.fn();
		render(
			<Link to="/posts" state={{ from: "/home" }}>
				Click me
			</Link>,
			{ navigate },
		);

		const user = userEvent.setup();
		await user.click(screen.getByRole("link"));

		expect(navigate).toHaveBeenCalledWith("/posts", { replace: false, relative: "route", state: { from: "/home" } });
	});

	it("Should not render state as a DOM attribute on the anchor element", () => {
		render(
			<Link to="/about" state={{ data: 42 }}>
				Click me
			</Link>,
		);

		const anchor = screen.getByRole("link");
		expect(anchor).not.toHaveAttribute("state");
	});

	it("Should forward ref to the underlying anchor element", () => {
		const ref = createRef<HTMLAnchorElement>();
		render(
			<Link to="/ref-test" ref={ref}>
				Ref Link
			</Link>,
		);

		expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
	});

	it("Should expose the correct href through the forwarded ref", () => {
		const ref = createRef<HTMLAnchorElement>();
		render(
			<Link to="/dashboard" ref={ref}>
				Dashboard
			</Link>,
		);

		expect(ref.current?.getAttribute("href")).toBe("/dashboard");
	});

	it("Should expose anchor DOM properties through the forwarded ref When used with HashRouter prefix", () => {
		const ref = createRef<HTMLAnchorElement>();
		render(
			<Link to="/settings" ref={ref}>
				Settings
			</Link>,
			{ prefix: "#" },
		);

		expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
		expect(ref.current?.getAttribute("href")).toBe("#/settings");
	});
});
