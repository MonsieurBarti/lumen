import { existsSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

export function getVersionedPath(basePath: string): string {
	if (!existsSync(basePath)) return basePath;

	const dir = dirname(basePath);
	const ext = extname(basePath);
	const name = basename(basePath, ext);

	let version = 2;
	while (true) {
		const candidate = join(dir, `${name}_v${version}${ext}`);
		if (!existsSync(candidate)) return candidate;
		version++;
	}
}
