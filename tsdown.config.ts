import path from "node:path";

import { defineConfig } from "tsdown";

function pureCreateContext() {
	return {
		name: "pure-create-context",
		transform(code: string, id: string) {
			if (id.includes("node_modules")) return;
			const result = code.replace(/createContext</g, "/* @__PURE__ */ createContext<");
			if (result === code) return;
			return { code: result, map: null };
		},
	};
}

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	deps: {
		neverBundle: ["react"],
	},
	treeshake: true,
	sourcemap: true,
	alias: {
		"@components": path.resolve(import.meta.dirname, "src/components"),
		"@hooks": path.resolve(import.meta.dirname, "src/hooks"),
		"@contexts": path.resolve(import.meta.dirname, "src/contexts"),
		"@utils": path.resolve(import.meta.dirname, "src/utils"),
		"@helpers": path.resolve(import.meta.dirname, "src/helpers"),
		"@stores": path.resolve(import.meta.dirname, "src/stores"),
	},
	plugins: [pureCreateContext()],
});
