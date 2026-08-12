/** Records the immediately previous alert shape from the real current save. */
import { readFileSync, writeFileSync } from "node:fs";

const current = JSON.parse(
  readFileSync(
    new URL("../fixtures/saves/current.json", import.meta.url),
    "utf8",
  ),
);
current.saveVersion = 11;
current.protocolVersion = 5;
for (const alert of current.state.alerts) {
  delete alert.category;
  delete alert.groupId;
  delete alert.source;
  delete alert.gameTime;
  delete alert.actionEntityId;
  delete alert.delegate;
  delete alert.acknowledged;
}
if (current.state.alerts.length === 0)
  throw new Error("the recorded save has no alert to migrate");
writeFileSync(
  new URL("../fixtures/saves/alert-v11.json", import.meta.url),
  `${JSON.stringify(current, null, 2)}\n`,
);
