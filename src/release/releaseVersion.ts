export function commandSetForRelease(): string[] {
  return [
    "npm run content:validate",
    "npm run verify:migrations",
    "npm run verify:replays",
    "npm run test:run",
    "npm run typecheck",
    "npm run lint",
    "npm run build",
    "npm run test:e2e",
    "npm run test:release:a11y",
    "npm run benchmark:all",
    "npm run stress:50y",
    "npm run invariant:sweep",
  ];
}

export function assertReleaseVersion(value: string): string {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))
    throw new Error("release version must be a stable semantic version");
  return value;
}
