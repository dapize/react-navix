import { describe, expect, it } from "vitest";

import { safeDecode } from "./safeDecode";

describe("safeDecode", () => {
	it("Should decode valid percent-encoded sequences", () => {
		expect(safeDecode("/ni%C3%B1o")).toBe("/niño");
	});

	it("Should decode a percent-encoded slash When the sequence is valid", () => {
		expect(safeDecode("/a%2Fb")).toBe("/a/b");
	});

	it("Should return the input unchanged When there is nothing to decode", () => {
		expect(safeDecode("/plain/path")).toBe("/plain/path");
	});

	it("Should return the input unchanged When a percent sequence is malformed", () => {
		expect(safeDecode("/products/50%")).toBe("/products/50%");
		expect(safeDecode("/caf%C3")).toBe("/caf%C3");
		expect(safeDecode("/%ZZ")).toBe("/%ZZ");
	});

	it("Should return the input unchanged When the input is empty", () => {
		expect(safeDecode("")).toBe("");
	});
});
