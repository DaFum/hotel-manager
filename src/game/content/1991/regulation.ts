import { CORE_CONTENT_REGISTRY } from "../corePack";
import type { RegulationRule } from "../../regulation/compliance";

export const REGULATION_RULES: readonly RegulationRule[] = [
  ...CORE_CONTENT_REGISTRY.allByKind("regulation"),
]
  .sort((a, b) =>
    a.simulationOrder !== b.simulationOrder
      ? a.simulationOrder - b.simulationOrder
      : a.id < b.id
        ? -1
        : a.id > b.id
          ? 1
          : 0,
  )
  .map((entry) => ({
    id: entry.id,
    simulationOrder: entry.simulationOrder,
    area: entry.area,
    jurisdictionId: entry.jurisdictionId,
    requirement: entry.requirement,
    effectiveAtMinutes: entry.effectiveAtMinutes,
    graceMinutes: entry.graceMinutes,
    noticeAtMinutes: entry.noticeAtMinutes,
    inspectionRiskBp: entry.inspectionRiskBp,
    consequenceMinor: entry.consequenceMinor,
    consequences: entry.consequences,
    affectedFacilityId: entry.affectedFacilityId,
    reputationDimension: entry.reputationDimension,
    reputationScope: entry.reputationScope,
    activation: entry.activation,
  }));
