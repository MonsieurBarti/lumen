import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

/* ────────────────────────────────────────────────────────────────────
   Image reference validation + base64 embedding for self-contained
   HTML output. Shared by lumen-slides, lumen-gallery, lumen-guide.
   ──────────────────────────────────────────────────────────────────── */

const MAX_EMBED_BYTES = 2 * 1024 * 1024;

const MIME_BY_EXT: Readonly<Record<string, string>> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".svg": "image/svg+xml",
	".gif": "image/gif",
	".webp": "image/webp",
};

export interface ImageReference {
	src: string;
	exists: boolean;
	absolutePath: string | null;
}

export type ImageTier = "existing" | "search" | "generate";

export interface ImageStrategy {
	tier: ImageTier;
}

function isExternalUrl(src: string): boolean {
	return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");
}

function inferMimeType(filePath: string): string {
	const lower = filePath.toLowerCase();
	for (const [ext, mime] of Object.entries(MIME_BY_EXT)) {
		if (lower.endsWith(ext)) return mime;
	}
	throw new Error(
		`Unsupported image format for "${filePath}". Supported: ${Object.keys(MIME_BY_EXT).join(", ")}`,
	);
}

/** Parse `<img src="...">` and CSS `url(...)` references from HTML. */
export function validateImageReferences(html: string, baseDir: string): ImageReference[] {
	const refs: ImageReference[] = [];
	const seen = new Set<string>();

	// <img src="...">
	const imgRe = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
	for (const match of html.matchAll(imgRe)) {
		const src = match[1];
		if (src === undefined || seen.has(src)) continue;
		seen.add(src);
		const absolutePath = isExternalUrl(src) ? null : resolveImagePath(src, baseDir);
		refs.push({
			src,
			exists: absolutePath !== null,
			absolutePath,
		});
	}

	// CSS url(...)
	const cssUrlRe = /url\s*\(\s*["']?([^"')\s]+)["']?\s*\)/gi;
	for (const match of html.matchAll(cssUrlRe)) {
		const src = match[1];
		if (src === undefined || seen.has(src)) continue;
		seen.add(src);
		const absolutePath = isExternalUrl(src) ? null : resolveImagePath(src, baseDir);
		refs.push({
			src,
			exists: absolutePath !== null,
			absolutePath,
		});
	}

	return refs;
}

/** Resolve a relative image path against baseDir. Returns null if missing. */
export function resolveImagePath(src: string, baseDir: string): string | null {
	const absolute = resolve(baseDir, src);
	return existsSync(absolute) ? absolute : null;
}

/** Replace local image references with base64 data URIs. Throws on missing / oversized / unsupported. */
export async function embedLocalImagesAsBase64(html: string, baseDir: string): Promise<string> {
	let result = html;

	// Process img src
	const imgRe = /(<img[^>]+src\s*=\s*["'])([^"']+)(["'][^>]*>)/gi;
	for (const match of html.matchAll(imgRe)) {
		const [full, prefix, src, suffix] = match;
		if (src === undefined || isExternalUrl(src)) continue;

		const absolutePath = resolveImagePath(src, baseDir);
		if (absolutePath === null) {
			throw new Error(`Image not found: ${src}`);
		}

		const mime = inferMimeType(absolutePath);
		const size = statSync(absolutePath).size;
		if (size > MAX_EMBED_BYTES) {
			throw new Error(
				`Image "${src}" exceeds 2 MB (${Math.round(size / 1024 / 1024)} MB). Reduce size or use an external URL.`,
			);
		}

		const data = readFileSync(absolutePath);
		const b64 = data.toString("base64");
		result = result.replace(full, `${prefix}data:${mime};base64,${b64}${suffix}`);
	}

	// Process CSS url(...)
	const cssUrlRe = /(url\s*\(\s*["']?)([^"')\s]+)(["']?\s*\))/gi;
	for (const match of html.matchAll(cssUrlRe)) {
		const [full, prefix, src, suffix] = match;
		if (src === undefined || isExternalUrl(src)) continue;

		const absolutePath = resolveImagePath(src, baseDir);
		if (absolutePath === null) {
			throw new Error(`Image not found: ${src}`);
		}

		const mime = inferMimeType(absolutePath);
		const size = statSync(absolutePath).size;
		if (size > MAX_EMBED_BYTES) {
			throw new Error(
				`Image "${src}" exceeds 2 MB (${Math.round(size / 1024 / 1024)} MB). Reduce size or use an external URL.`,
			);
		}

		const data = readFileSync(absolutePath);
		const b64 = data.toString("base64");
		result = result.replace(full, `${prefix}data:${mime};base64,${b64}${suffix}`);
	}

	return result;
}
