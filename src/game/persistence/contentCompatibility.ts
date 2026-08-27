export const CURRENT_CONTENT_SCHEMA_VERSION = 1;
export const CURRENT_CONTENT_VERSION = "1991.1";

export type ContentCompatibility =
  "compatible" | "migrate-schema" | "preserve-balance" | "incompatible";

export interface ContentVersionDescriptor {
  saveSchemaVersion: number;
  currentSchemaVersion: number;
  saveContentVersion: string;
  currentContentVersion: string;
  migrationAvailable?: boolean;
}

export function compatibility(
  value: ContentVersionDescriptor,
): ContentCompatibility {
  if (value.saveSchemaVersion !== value.currentSchemaVersion)
    return value.migrationAvailable ? "migrate-schema" : "incompatible";
  if (value.saveContentVersion !== value.currentContentVersion)
    return value.migrationAvailable ? "preserve-balance" : "incompatible";
  return "compatible";
}

/**
 * A content migration changes definitions and version metadata, not historical
 * authoritative values already copied into a running campaign. Supplier
 * payment terms therefore apply to new orders; existing pending orders keep
 * their persisted delivery and settlement state.
 */
export function migrateContentVersion<T extends { contentVersion: string }>(
  value: T,
): T {
  if (value.contentVersion !== "plan-06-v6")
    throw new Error(`no content migration from ${value.contentVersion}`);
  return { ...value, contentVersion: CURRENT_CONTENT_VERSION };
}
