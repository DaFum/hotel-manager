import { writeFileSync } from "node:fs";
import { z } from "zod";
import {
  CONTENT_SCHEMA_VERSION,
  ContentPackSchema,
} from "../src/content-schema/contentPack";

const target = new URL(
  `../src/content-schema/__snapshots__/schemaVersion${CONTENT_SCHEMA_VERSION}.json`,
  import.meta.url,
);
writeFileSync(
  target,
  `${JSON.stringify(z.toJSONSchema(ContentPackSchema), null, 2)}\n`,
);
