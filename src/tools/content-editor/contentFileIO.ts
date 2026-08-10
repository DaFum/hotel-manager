import {
  ContentPackSchema,
  type ContentPack,
} from "../../content-schema/contentPack";
import { validateReferences } from "../../game/content/validateReferences";

export function exportContentPack(pack: ContentPack): string {
  const parsed = ContentPackSchema.parse(pack);
  const errors = validateReferences(Object.values(parsed.entries));
  if (errors.length)
    throw new Error(`invalid content references: ${JSON.stringify(errors)}`);
  const entries = Object.fromEntries(
    Object.entries(parsed.entries).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
  );
  return `${JSON.stringify({ ...parsed, entries }, null, 2)}\n`;
}

export function importContentPack(text: string): ContentPack {
  const parsed = ContentPackSchema.parse(JSON.parse(text));
  const errors = validateReferences(Object.values(parsed.entries));
  if (errors.length)
    throw new Error(`invalid content references: ${JSON.stringify(errors)}`);
  return parsed;
}
