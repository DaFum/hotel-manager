import type { ContentPack } from "../../content-schema/contentPack";
import { loadContentPack } from "../../game/content/loadContentPack";

export function exportContentPack(pack: ContentPack): string {
  const parsed = loadContentPack(pack).pack;
  const entries = Object.fromEntries(
    Object.entries(parsed.entries).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
  );
  return `${JSON.stringify({ ...parsed, entries }, null, 2)}\n`;
}

export function importContentPack(text: string): ContentPack {
  return loadContentPack(JSON.parse(text)).pack;
}
