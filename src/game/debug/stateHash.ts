const PRESENTATION_KEYS = new Set(["facilities"]);

function canonical(value: unknown, key?: string): unknown {
  if (key && PRESENTATION_KEYS.has(key)) return undefined;
  if (value instanceof Map)
    return [...value.entries()]
      .map(([k, v]) => [canonical(k), canonical(v)])
      .sort((a, b) => {
        const left = JSON.stringify(a[0]);
        const right = JSON.stringify(b[0]);
        return left < right ? -1 : left > right ? 1 : 0;
      });
  if (value instanceof Set)
    return [...value]
      .map((item) => canonical(item))
      .sort((a, b) => {
        const left = JSON.stringify(a);
        const right = JSON.stringify(b);
        return left < right ? -1 : left > right ? 1 : 0;
      });
  if (Array.isArray(value)) return value.map((item) => canonical(item));
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const entryKey of Object.keys(value).sort()) {
      const item = canonical(
        (value as Record<string, unknown>)[entryKey],
        entryKey,
      );
      if (item !== undefined) result[entryKey] = item;
    }
    return result;
  }
  if (typeof value === "number" && !Number.isFinite(value))
    throw new Error("cannot hash non-finite authoritative state");
  return value;
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
