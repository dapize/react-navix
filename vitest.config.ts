import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./testSetup.ts"],
		environment: "jsdom",
		include: ["src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/**/*.types.ts", "src/**/index.ts", "src/test-utils.tsx"],
			reporter: ["text", "html"],
		},
	},
	resolve: {
		alias: {
			"@components": path.resolve(import.meta.dirname, "src/components"),
			"@hooks": path.resolve(import.meta.dirname, "src/hooks"),
			"@contexts": path.resolve(import.meta.dirname, "src/contexts"),
			"@utils": path.resolve(import.meta.dirname, "src/utils"),
			"@helpers": path.resolve(import.meta.dirname, "src/helpers"),
			"@stores": path.resolve(import.meta.dirname, "src/stores"),
		},
	},
});
