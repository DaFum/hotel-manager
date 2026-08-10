export interface PerfSample {
  tickMs: number;
  commandAckMs: number;
  visibleAgents: number;
  saveBytes: number;
  deltaBytes: number;
}

export function serializedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
