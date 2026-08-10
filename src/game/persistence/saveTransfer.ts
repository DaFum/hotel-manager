import { PROTOCOL_VERSION } from "../domain/protocol";
import { CORE_CONTENT_PACK } from "../content/corePack";
import { CORE_CONTENT_REGISTRY } from "../content/corePack";
import { migrateEnvelope, validateEnvelope } from "./saveSchema";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "./saveVersions";

export const SAVE_TRANSFER_VERSION = 1;
export const MAX_SAVE_TRANSFER_BYTES = 10 * 1024 * 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export interface SaveProvider {
  save(slot: string, envelope: SaveEnvelope): Promise<void>;
  load(slot: string): Promise<SaveEnvelope | null>;
}

export interface SaveTransferFile {
  format: "hotel-manager-save";
  transferVersion: number;
  saveVersion: number;
  contentVersion: string;
  protocolVersion: number;
  requiredContentPacks: Array<{ packId: string; contentVersion: string }>;
  payload: SaveEnvelope;
  checksum: string;
}

type UnsignedTransfer = Omit<SaveTransferFile, "checksum">;

const CONTENT_REFERENCE_FIELDS = new Set([
  "brandId",
  "definitionId",
  "moduleId",
  "segmentId",
]);

/** References copied into authoritative state must still exist in this build. */
export function validateSaveContentReferences(state: unknown): string[] {
  const missing = new Set<string>();
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    for (const [field, child] of Object.entries(value)) {
      if (
        CONTENT_REFERENCE_FIELDS.has(field) &&
        typeof child === "string" &&
        !CORE_CONTENT_REGISTRY.has(child)
      )
        missing.add(child);
      else visit(child);
    }
  };
  visit(state);
  return [...missing].sort();
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}
async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function exportSaveFile(
  payload: SaveEnvelope,
  requiredContentPacks: SaveTransferFile["requiredContentPacks"] = [
    {
      packId: CORE_CONTENT_PACK.packId,
      contentVersion: CORE_CONTENT_PACK.contentVersion,
    },
  ],
): Promise<Uint8Array> {
  const problems = validateEnvelope(payload);
  if (problems.length)
    throw new Error(`cannot export invalid save: ${problems.join("; ")}`);
  const missingContent = validateSaveContentReferences(payload.state);
  if (missingContent.length)
    throw new Error(
      `cannot export save with missing content: ${missingContent.join(", ")}`,
    );
  const unsigned: UnsignedTransfer = {
    format: "hotel-manager-save",
    transferVersion: SAVE_TRANSFER_VERSION,
    saveVersion: payload.saveVersion,
    contentVersion: payload.contentVersion,
    protocolVersion: payload.protocolVersion,
    requiredContentPacks,
    payload,
  };
  return encoder.encode(
    serialize({ ...unsigned, checksum: await sha256(serialize(unsigned)) }),
  );
}

export async function parseSaveFile(bytes: Uint8Array): Promise<SaveEnvelope> {
  if (bytes.byteLength > MAX_SAVE_TRANSFER_BYTES)
    throw new Error("save file exceeds size limit");
  let candidate: unknown;
  try {
    candidate = JSON.parse(decoder.decode(bytes));
  } catch {
    throw new Error("save file is not valid UTF-8 JSON");
  }
  if (!candidate || typeof candidate !== "object")
    throw new Error("save transfer envelope is missing");
  const file = candidate as Partial<SaveTransferFile>;
  if (
    file.format !== "hotel-manager-save" ||
    file.transferVersion !== SAVE_TRANSFER_VERSION
  )
    throw new Error("unsupported save transfer format");
  if (
    typeof file.checksum !== "string" ||
    !file.payload ||
    !Array.isArray(file.requiredContentPacks)
  )
    throw new Error("save transfer envelope is incomplete");
  const { checksum, ...unsigned } = file as SaveTransferFile;
  if ((await sha256(serialize(unsigned))) !== checksum)
    throw new Error("save checksum mismatch");
  if (
    file.saveVersion !== file.payload.saveVersion ||
    file.contentVersion !== file.payload.contentVersion ||
    file.protocolVersion !== file.payload.protocolVersion
  )
    throw new Error("save version headers disagree with payload");
  for (const required of file.requiredContentPacks)
    if (
      required.packId !== CORE_CONTENT_PACK.packId ||
      required.contentVersion !== CORE_CONTENT_PACK.contentVersion
    )
      throw new Error(
        `required content pack is unavailable: ${required.packId}@${required.contentVersion}`,
      );
  if (
    file.payload.saveVersion > SAVE_VERSION ||
    file.payload.protocolVersion !== PROTOCOL_VERSION
  )
    throw new Error("save was written by an incompatible build");
  const migrated = migrateEnvelope(file.payload);
  if (migrated.contentVersion !== CONTENT_VERSION)
    throw new Error(
      `content version ${migrated.contentVersion} is unavailable`,
    );
  const problems = validateEnvelope(migrated);
  if (problems.length)
    throw new Error(`invalid imported save: ${problems.join("; ")}`);
  const missingContent = validateSaveContentReferences(migrated.state);
  if (missingContent.length)
    throw new Error(
      `imported save references missing content: ${missingContent.join(", ")}`,
    );
  return migrated;
}

export async function importSaveFile(
  provider: SaveProvider,
  slot: string,
  bytes: Uint8Array,
): Promise<void> {
  const validated = await parseSaveFile(bytes);
  await provider.save(slot, validated);
}
