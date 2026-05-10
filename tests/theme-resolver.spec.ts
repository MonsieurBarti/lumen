import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveTheme } from "../src/utils/theme-resolver.js";

describe("resolveTheme", () => {
	let projectTempDir: string;
	let homeTempDir: string;

	beforeEach(async () => {
		projectTempDir = await mkdtemp(join(os.tmpdir(), "lumen-project-"));
		homeTempDir = await mkdtemp(join(os.tmpdir(), "lumen-home-"));
		vi.stubEnv("HOME", homeTempDir);
		vi.stubEnv("USERPROFILE", homeTempDir);
	});

	afterEach(async () => {
		vi.unstubAllEnvs();
		await rm(projectTempDir, { recursive: true, force: true });
		await rm(homeTempDir, { recursive: true, force: true });
	});

	it("returns project theme when _theme.css exists in cwd", async () => {
		const css = "/* project theme */";
		await writeFile(join(projectTempDir, "_theme.css"), css, "utf-8");

		const result = await resolveTheme({ cwd: projectTempDir });

		expect(result.source).toBe("project");
		expect(result.path).toBe(join(projectTempDir, "_theme.css"));
		expect(result.css).toBe(css);
	});

	it("returns global theme when ~/.agent/lumen/_theme.css exists", async () => {
		const css = "/* global theme */";
		const globalDir = join(homeTempDir, ".agent", "lumen");
		await mkdir(globalDir, { recursive: true });
		await writeFile(join(globalDir, "_theme.css"), css, "utf-8");

		const result = await resolveTheme({ cwd: projectTempDir });

		expect(result.source).toBe("global");
		expect(result.path).toBe(join(globalDir, "_theme.css"));
		expect(result.css).toBe(css);
	});

	it("falls back to preset when no custom theme exists", async () => {
		const result = await resolveTheme({ cwd: projectTempDir });

		expect(result.source).toBe("preset");
		expect(result.path).toBe("skills/_shared/aesthetics/editorial.css");
		expect(result.css).toContain("editorial.css");
		expect(result.css.length).toBeGreaterThan(0);
	});

	it("gracefully falls through project -> global -> preset hierarchy", async () => {
		// No project, no global -> preset
		let result = await resolveTheme({ cwd: projectTempDir });
		expect(result.source).toBe("preset");
		expect(result.path).toContain("editorial.css");

		// Add global theme -> global
		const globalDir = join(homeTempDir, ".agent", "lumen");
		await mkdir(globalDir, { recursive: true });
		await writeFile(join(globalDir, "_theme.css"), "/* global */", "utf-8");
		result = await resolveTheme({ cwd: projectTempDir });
		expect(result.source).toBe("global");

		// Add project theme -> project
		await writeFile(join(projectTempDir, "_theme.css"), "/* project */", "utf-8");
		result = await resolveTheme({ cwd: projectTempDir });
		expect(result.source).toBe("project");
	});

	it("loads a custom preset when specified", async () => {
		const result = await resolveTheme({
			cwd: projectTempDir,
			preset: "midnight-editorial",
		});

		expect(result.source).toBe("preset");
		expect(result.path).toBe("skills/_shared/aesthetics/midnight-editorial.css");
		expect(result.css).toContain("midnight-editorial.css");
	});

	it("defaults to editorial preset when no preset is specified", async () => {
		const result = await resolveTheme({ cwd: projectTempDir });

		expect(result.source).toBe("preset");
		expect(result.path).toContain("editorial.css");
	});

	it("propagates non-ENOENT errors from the project path", async () => {
		// Creating a directory with the same name forces readFile to throw
		// a non-ENOENT error (EISDIR on Unix-like systems).
		await mkdir(join(projectTempDir, "_theme.css"));

		await expect(resolveTheme({ cwd: projectTempDir })).rejects.toThrow();
	});

	it("propagates non-ENOENT errors from the global path", async () => {
		const globalDir = join(homeTempDir, ".agent", "lumen");
		await mkdir(globalDir, { recursive: true });
		await mkdir(join(globalDir, "_theme.css"));

		await expect(resolveTheme({ cwd: projectTempDir })).rejects.toThrow();
	});

	it("throws for an unknown preset", async () => {
		await expect(
			resolveTheme({ cwd: projectTempDir, preset: "nonexistent-preset" }),
		).rejects.toThrow(/unknown aesthetic preset.*nonexistent-preset/i);
	});
});
