import { existsSync, rmSync, statSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exportHtmlToPptx } from "../src/utils/pptx-export.js";

describe("pptx-export", () => {
	it("exports docs/examples/slides.html without throwing", async () => {
		const dir = mkdtempSync(join(tmpdir(), "pptx-export-test-"));
		const outputPath = join(dir, "deck.pptx");
		await exportHtmlToPptx({
			htmlPath: join(import.meta.dirname, "../docs/examples/slides.html"),
			outputPath,
		});
		expect(existsSync(outputPath)).toBe(true);
		const stats = statSync(outputPath);
		expect(stats.size).toBeGreaterThan(0);
		rmSync(dir, { recursive: true });
	}, 30000);
});
