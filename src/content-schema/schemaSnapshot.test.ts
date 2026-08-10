import schemaVersion1 from "./__snapshots__/schemaVersion1.json";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { ContentPackSchema } from "./contentPack";

describe("content schema snapshot", () => {
  it("is the complete generated JSON schema for version 1", () => {
    expect(schemaVersion1).toEqual(
      z.toJSONSchema(ContentPackSchema, { io: "input" }),
    );
  });
});
