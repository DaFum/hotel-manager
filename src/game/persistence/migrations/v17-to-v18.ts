import type { SaveEnvelope } from "../saveVersions";
import { createDepartmentHeadAuthority } from "../../management/managerAuthority";

export function migrateV17ToV18(save: SaveEnvelope): SaveEnvelope {
  const oldState = save.state as Record<string, any>;
  const newState = {
    ...oldState,
    departmentHeadAuthorities: oldState.departmentHeadAuthorities ?? {
      housekeeping: createDepartmentHeadAuthority(),
      reception: createDepartmentHeadAuthority(),
      fnb: createDepartmentHeadAuthority(),
      maintenance: createDepartmentHeadAuthority(),
    },
  };

  return {
    ...save,
    saveVersion: 18,
    state: newState,
  };
}
