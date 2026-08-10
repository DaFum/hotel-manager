const PRESENTATION_KEYS = new Set(["facilities"]);

type CanonicalValue =
  | { type: "undefined" | "null" }
  | { type: "boolean" | "number" | "string" | "bigint"; value: string }
  | { type: "array" | "set"; values: CanonicalValue[] }
  | { type: "map"; entries: [CanonicalValue, CanonicalValue][] }
  | { type: "object"; entries: [string, CanonicalValue][] };

const compareText = (a: unknown, b: unknown): number => {
  const left = JSON.stringify(a);
  const right = JSON.stringify(b);
  return left < right ? -1 : left > right ? 1 : 0;
};

function canonical(value: unknown): CanonicalValue {
  if (value === undefined) return { type: "undefined" };
  if (value === null) return { type: "null" };
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("cannot hash non-finite authoritative state");
    return {
      type: "number",
      value: Object.is(value, -0) ? "-0" : String(value),
    };
  }
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  )
    return { type: typeof value, value: String(value) } as CanonicalValue;
  if (value instanceof Map)
    return {
      type: "map",
      entries: [...value.entries()]
        .map(
          ([key, item]) =>
            [canonical(key), canonical(item)] as [
              CanonicalValue,
              CanonicalValue,
            ],
        )
        .sort((a, b) => compareText(a[0], b[0])),
    };
  if (value instanceof Set)
    return { type: "set", values: [...value].map(canonical).sort(compareText) };
  if (Array.isArray(value))
    return { type: "array", values: value.map(canonical) };
  if (typeof value === "object")
    return {
      type: "object",
      entries: Object.keys(value)
        .filter((key) => !PRESENTATION_KEYS.has(key))
        .sort()
        .map((key) => [
          key,
          canonical((value as Record<string, unknown>)[key]),
        ]),
    };
  throw new Error(`cannot hash ${typeof value}`);
}

export function canonicalState(value: unknown): string {
  return JSON.stringify(canonical(value));
}

/** Stable FNV-1a hash without a platform crypto dependency. */
export function stateHash(value: unknown): string {
  const text = canonicalState(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/** Public release-verifier name for the canonical authoritative-state hash. */
export const stableStateHash = stateHash;
