import { expect, it } from "vitest";
import { eraCapabilities } from "./eraCapabilities";
it("derives interface capabilities only from adoption", () => {
  expect(eraCapabilities(1000).mobileCheckIn).toBe(false);
  expect(
    eraCapabilities({
      personalComputerBp: 3000,
      internetBp: 4000,
      smartphoneBp: 4000,
      channelManagerBp: 5000,
    }),
  ).toEqual({
    digitalBackOffice: true,
    onlineDistribution: true,
    smartphoneVisuals: true,
    mobileCheckIn: true,
    channelAutomation: true,
  });
});
