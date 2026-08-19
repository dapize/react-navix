import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { render, screen } from "../../test-utils";
import { NavLink } from "./NavLink";

describe("NavLink", () => {
	it("Should apply activeClassName When current path matches target", () => {
		render(
			<NavLink to="/about" activeClassName="active-link">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/about", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active-link");
	});

	it("Should not apply activeClassName When current path does not match", () => {
		render(
			<NavLink to="/about" activeClassName="active-link">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/dashboard", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).not.toHaveClass("active-link");
	});

	it("Should apply activeStyle When current path matches", () => {
		render(
			<NavLink to="/posts" activeStyle={{ color: "red", fontWeight: "bold" }}>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/posts", search: "", hash: "" },
			},
		);

		const anchor = screen.getByRole("link");
		expect(anchor.style.color).toBe("red");
		expect(anchor.style.fontWeight).toBe("bold");
	});

	it("Should merge activeStyle with base style When active", () => {
		render(
			<NavLink to="/posts" style={{ fontSize: "16px" }} activeStyle={{ color: "red" }}>
				Nav Link
			</NavLink>,
			{ location: { pathname: "/posts", search: "", hash: "" } },
		);

		const anchor = screen.getByRole("link");
		expect(anchor.style.fontSize).toBe("16px");
		expect(anchor.style.color).toBe("red");
	});

	it("Should apply active class for nested path When not exact", () => {
		render(
			<NavLink to="/users" activeClassName="active">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should NOT apply active class for nested path When exact is true", () => {
		render(
			<NavLink to="/users" activeClassName="active" exact>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).not.toHaveClass("active");
	});

	it("Should apply active class for exact match When exact is true", () => {
		render(
			<NavLink to="/users/42" activeClassName="active" exact>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should NOT apply active class for nested path When end is true", () => {
		render(
			<NavLink to="/users" activeClassName="active" end>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).not.toHaveClass("active");
	});

	it("Should apply active class for exact match When end is true", () => {
		render(
			<NavLink to="/users/42" activeClassName="active" end>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should prioritize exact over end When both are provided", () => {
		render(
			<NavLink to="/users" activeClassName="active" exact={false} end={true}>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should NOT mark root path as active When on a different route", () => {
		render(
			<NavLink to="/" activeClassName="active">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/dashboard", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).not.toHaveClass("active");
	});

	it("Should mark root path as active When current path is root", () => {
		render(
			<NavLink to="/" activeClassName="active">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should preserve base className alongside activeClassName", () => {
		render(
			<NavLink to="/about" className="nav-item" activeClassName="active">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/about", search: "", hash: "" },
			},
		);

		const anchor = screen.getByRole("link");
		expect(anchor.className).toContain("nav-item");
		expect(anchor.className).toContain("active");
	});

	it("Should apply active class When relative '..' resolves to a parent that matches non-exact", () => {
		render(
			<NavLink to=".." activeClassName="active">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should apply active class When relative '../settings' resolves to the current path", () => {
		render(
			<NavLink to="../settings" activeClassName="active">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/settings", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should apply active class When relative path resolves to exact match with exact prop", () => {
		render(
			<NavLink to="../settings" activeClassName="active" exact>
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/settings", search: "", hash: "" },
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should apply active class When relative 'route' resolves against routeBase", () => {
		render(
			<NavLink to=".." activeClassName="active" relative="route">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
				routeBase: "/users/42",
			},
		);

		expect(screen.getByRole("link")).toHaveClass("active");
	});

	it("Should not apply active class When relative 'route' resolves to non-matching path", () => {
		render(
			<NavLink to="../other" activeClassName="active" relative="route">
				Nav Link
			</NavLink>,
			{
				location: { pathname: "/users/42", search: "", hash: "" },
				routeBase: "/users/42",
			},
		);

		expect(screen.getByRole("link")).not.toHaveClass("active");
	});

	it("Should forward ref to the underlying anchor element", () => {
		const ref = createRef<HTMLAnchorElement>();
		render(
			<NavLink to="/about" activeClassName="active" ref={ref}>
				Ref NavLink
			</NavLink>,
			{ location: { pathname: "/about", search: "", hash: "" } },
		);

		expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
	});

	it("Should expose the correct href through the forwarded ref", () => {
		const ref = createRef<HTMLAnchorElement>();
		render(
			<NavLink to="/posts" activeClassName="active" ref={ref}>
				Posts
			</NavLink>,
			{ location: { pathname: "/dashboard", search: "", hash: "" } },
		);

		expect(ref.current?.getAttribute("href")).toBe("/posts");
	});
});
