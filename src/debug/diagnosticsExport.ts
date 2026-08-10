export interface DiagnosticsInput {
  saveVersion: number;
  contentVersion?: string;
  protocolVersion?: number;
  stateHash: string;
  seed?: number;
  gameTimeMinutes?: number;
  commandIds?: readonly string[];
  eventTypes?: readonly string[];
  rngState?: Readonly<Record<string, number>>;
  errorCodes?: readonly string[];
  playerName?: string;
  freeText?: string;
}

/** Explicit allow-list: user-entered text and save contents never reach the export. */
export function sanitizeDiagnostics(input: DiagnosticsInput) {
  return {
    saveVersion: input.saveVersion,
    ...(input.contentVersion === undefined
      ? {}
      : { contentVersion: input.contentVersion }),
    ...(input.protocolVersion === undefined
      ? {}
      : { protocolVersion: input.protocolVersion }),
    stateHash: input.stateHash,
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    ...(input.gameTimeMinutes === undefined
      ? {}
      : { gameTimeMinutes: input.gameTimeMinutes }),
    ...(input.commandIds === undefined
      ? {}
      : { commandIds: [...input.commandIds] }),
    ...(input.eventTypes === undefined
      ? {}
      : { eventTypes: [...input.eventTypes] }),
    ...(input.rngState === undefined
      ? {}
      : {
          rngState: Object.fromEntries(
            Object.entries(input.rngState).sort(([a], [b]) =>
              a < b ? -1 : a > b ? 1 : 0,
            ),
          ),
        }),
    ...(input.errorCodes === undefined
      ? {}
      : { errorCodes: [...input.errorCodes] }),
  };
}

/** Creates a local download payload only; this module has no upload or telemetry path. */
export function diagnosticsJson(input: DiagnosticsInput): string {
  return `${JSON.stringify(sanitizeDiagnostics(input), null, 2)}\n`;
}
