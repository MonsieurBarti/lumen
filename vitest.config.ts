import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["tests/**/*.spec.ts", "tests/**/*.test.ts"],
		exclude: ["node_modules", "dist", ".worktrees"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			// Coverage targets the TypeScript source we author. Skill assets
			// (HTML/CSS/JS lifted from upstreams) live under skills/ and ship
			// verbatim — they are documented + asset-tested in
			// tests/skill-assets.spec.ts but not unit-tested at the line level.
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.spec.ts",
				"src/**/*.test.ts",
				"src/**/*.d.ts",
				"src/types.ts",
				// Integration-bound modules — exercised end-to-end in PI, not
				// in unit tests. Wiring them into v8 coverage would require
				// mocking PI's ExtensionAPI, fs, and fetch surfaces.
				"src/index.ts",
				"src/utils/browser-open.ts",
				"src/utils/file-writer.ts",
				"src/update-check.ts",
			],
			thresholds: {
				lines: 85,
				functions: 85,
				branches: 80,
				statements: 85,
			},
		},
	},
});
