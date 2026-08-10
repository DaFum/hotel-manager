import { describe, expect, it } from "vitest";
import { commandSetForRelease } from "./releaseVersion";
describe("content release gate", () => {
  it("validates content before build packaging", () => {
    const commands = commandSetForRelease();
    expect(commands).toContain("npm run content:validate");
    expect(commands.indexOf("npm run content:validate")).toBeLessThan(
      commands.indexOf("npm run build"),
    );
  });
});
