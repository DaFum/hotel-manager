import type { ContentEntry } from "../../content-schema/contentPack";

export interface ReferenceError {
  sourceId: string;
  targetId: string;
  field: string;
  reason: "missing" | "wrong-kind" | "cycle" | "duplicate-order";
}

function fields(
  record: ContentEntry,
): Array<
  [string, readonly string[], readonly ContentEntry["kind"][] | undefined]
> {
  switch (record.kind) {
    case "facility":
      return [
        ["requiredTechnologyIds", record.requiredTechnologyIds, ["technology"]],
      ];
    case "roomProduct":
      return [
        ["requiredTechnologyIds", record.requiredTechnologyIds, ["technology"]],
      ];
    case "technology":
      return [
        ["prerequisiteIds", record.prerequisiteIds, ["technology"]],
        ["competingStandardIds", record.competingStandardIds, ["technology"]],
        [
          "replacedByTechnologyId",
          record.replacedByTechnologyId ? [record.replacedByTechnologyId] : [],
          ["technology"],
        ],
      ];
    case "trend":
      return [
        ["driverTechnologyIds", record.driverTechnologyIds, ["technology"]],
      ];
    case "guestSegment":
      return [
        ["preferredFacilityIds", record.preferredFacilityIds, ["facility"]],
      ];
    case "event":
      return [
        ["requiredTechnologyIds", record.requiredTechnologyIds, ["technology"]],
      ];
    case "recipe":
      return [
        ["ingredients", record.ingredients.map((x) => x.itemId), ["item"]],
      ];
    case "supplier":
      return [["itemIds", record.itemIds, ["item"]]];
    case "rival":
      return [["homeCityId", [record.homeCityId], ["city"]]];
    case "brand":
      return [
        ["requiredFacilityIds", record.requiredFacilityIds, ["facility"]],
        ["requiredTechnologyIds", record.requiredTechnologyIds, ["technology"]],
      ];
    default:
      return [];
  }
}

export function validateReferences(
  records: readonly ContentEntry[],
): ReferenceError[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  const errors: ReferenceError[] = [];
  const orderedKinds = new Map<string, Set<number>>();
  for (const record of records) {
    if (!("simulationOrder" in record)) continue;
    const orders = orderedKinds.get(record.kind) ?? new Set<number>();
    if (orders.has(record.simulationOrder))
      errors.push({
        sourceId: record.id,
        targetId: String(record.simulationOrder),
        field: "simulationOrder",
        reason: "duplicate-order",
      });
    orders.add(record.simulationOrder);
    orderedKinds.set(record.kind, orders);
  }
  for (const record of [...records].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  ))
    for (const [field, targets, kinds] of fields(record))
      for (const targetId of targets) {
        const target = byId.get(targetId);
        if (!target)
          errors.push({
            sourceId: record.id,
            targetId,
            field,
            reason: "missing",
          });
        else if (kinds && !kinds.includes(target.kind))
          errors.push({
            sourceId: record.id,
            targetId,
            field,
            reason: "wrong-kind",
          });
      }

  const technologies = records.filter(
    (record): record is Extract<ContentEntry, { kind: "technology" }> =>
      record.kind === "technology",
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (technology: (typeof technologies)[number]) => {
    if (visited.has(technology.id)) return;
    visiting.add(technology.id);
    for (const targetId of technology.prerequisiteIds) {
      if (visiting.has(targetId))
        errors.push({
          sourceId: technology.id,
          targetId,
          field: "prerequisiteIds",
          reason: "cycle",
        });
      const target = byId.get(targetId);
      if (target?.kind === "technology" && !visiting.has(targetId))
        visit(target);
    }
    visiting.delete(technology.id);
    visited.add(technology.id);
  };
  for (const technology of technologies) visit(technology);
  return errors;
}
