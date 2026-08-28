/**
 * TypeBox string-enum helper compatible with OMP's remapped typebox shim.
 *
 * Avoids `Type.Unsafe` (missing on some OMP shims) and default `import Type`
 * (OMP remaps named `{ Type }` only). Uses a Union of Literals instead.
 */

import { type TSchema, Type } from "typebox";

export function stringEnum<const T extends readonly string[]>(
	values: T,
	options?: { description?: string; default?: T[number] },
): TSchema {
	const literals = values.map((v) => Type.Literal(v));
	const unionOptions =
		options?.description !== undefined || options?.default !== undefined
			? {
					...(options.description !== undefined ? { description: options.description } : {}),
					...(options.default !== undefined ? { default: options.default } : {}),
				}
			: undefined;
	return Type.Union(literals, unionOptions);
}
