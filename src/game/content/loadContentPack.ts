import {
  CONTENT_SCHEMA_VERSION,
  ContentPackSchema,
  type ContentPack,
} from "../../content-schema/contentPack";
import { ContentRegistry } from "./registry";
import { validateReferences } from "./validateReferences";

export interface LoadedContentPack {
  pack: ContentPack;
  registry: ContentRegistry;
}

/** The single build/load boundary: no raw pack reaches runtime systems. */
export function loadContentPack(raw: unknown): LoadedContentPack {
  const parsed = ContentPackSchema.parse(raw);
  const items = new Map(
    Object.values(parsed.entries)
      .filter((entry) => entry.kind === "item")
      .map((entry) => [entry.id, entry.referenceCostMinor]),
  );
  const pack = ContentPackSchema.parse({
    ...parsed,
    entries: Object.fromEntries(
      Object.entries(parsed.entries).map(([id, entry]) => [
        id,
        entry.kind === "recipe"
          ? {
              ...entry,
              // A quantity describes preparation, not the normalized cost of
              // one sold portion. Cost comes from each referenced portion.
              ingredientCostMinor: entry.ingredients.reduce(
                (sum, ingredient) => sum + (items.get(ingredient.itemId) ?? 0),
                0,
              ),
            }
          : entry,
      ]),
    ),
  });
  if (pack.schemaVersion !== CONTENT_SCHEMA_VERSION)
    throw new Error(
      `unsupported content schema version ${pack.schemaVersion}; expected ${CONTENT_SCHEMA_VERSION}`,
    );
  const referenceErrors = validateReferences(Object.values(pack.entries));
  if (referenceErrors.length > 0)
    throw new Error(
      `invalid content references: ${JSON.stringify(referenceErrors)}`,
    );
  const registry = new ContentRegistry();
  for (const entry of Object.values(pack.entries)) registry.add(entry);
  return { pack, registry };
}
