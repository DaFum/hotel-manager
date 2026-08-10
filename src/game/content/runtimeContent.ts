import { CORE_CONTENT_REGISTRY } from "./corePack";

export const TECHNOLOGY_CONTENT = [
  ...CORE_CONTENT_REGISTRY.allByKind("technology"),
].sort((a, b) => a.simulationOrder - b.simulationOrder);
export const TREND_CONTENT = [...CORE_CONTENT_REGISTRY.allByKind("trend")].sort(
  (a, b) => a.simulationOrder - b.simulationOrder,
);
const technologyByContentId = new Map(
  TECHNOLOGY_CONTENT.map((entry) => [entry.id, entry]),
);
export const TECHNOLOGY_REQUIREMENTS: Readonly<
  Record<string, readonly string[]>
> = Object.fromEntries(
  TECHNOLOGY_CONTENT.map((entry) => [
    entry.runtimeId,
    entry.prerequisiteIds.map((id) => technologyByContentId.get(id)!.runtimeId),
  ]),
);
