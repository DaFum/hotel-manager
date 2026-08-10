import { expect, it } from "vitest";
import frozenV7 from "../fixtures/save-v7.json";
import frozenV8 from "../fixtures/save-v8.json";
import { migrateV7ToV8 } from "./v7-to-v8";
import { migrateEnvelope, validateEnvelope } from "../saveSchema";
import type { SaveEnvelope } from "../saveVersions";

it("moves protocol-three v7 saves to save eight and protocol four", () => {
  const next = migrateV7ToV8(
    structuredClone(frozenV7) as unknown as SaveEnvelope,
  );
  expect(next.saveVersion).toBe(8);
  expect(next.protocolVersion).toBe(4);
  expect(
    validateEnvelope(
      migrateEnvelope(structuredClone(frozenV7) as unknown as SaveEnvelope),
    ),
  ).toEqual([]);
});

it("records a loadable v8 fixture from a real game", () => {
  expect(validateEnvelope(frozenV8 as unknown as SaveEnvelope)).toEqual([]);
});
