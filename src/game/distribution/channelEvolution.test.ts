import { expect, it } from "vitest";
import {
  acceptAllotment,
  availableChannels,
  netChannelRevenueMinor,
  sharedAvailableRooms,
} from "./channelEvolution";
it("gates OTA by adoption and implementation, charges commission and shares inventory", () => {
  expect(
    availableChannels({
      technologyAdoptionBp: { internet: 9000 },
      hotelImplementations: new Set(),
      standardNetworkBp: 9000,
    }).some((c) => c.id === "ota"),
  ).toBe(false);
  expect(
    availableChannels({
      technologyAdoptionBp: { internet: 9000 },
      hotelImplementations: new Set(["channel-manager"]),
      standardNetworkBp: 9000,
    }).some((c) => c.id === "ota"),
  ).toBe(true);
  expect(netChannelRevenueMinor(10000, 1800)).toBe(8200);
  expect(
    sharedAvailableRooms(10, { "1991-01-01": 8, "1991-01-02": 9 }, [
      "1991-01-01",
      "1991-01-02",
    ]),
  ).toBe(1);
  expect(acceptAllotment(10, 8, 3)).toBe(false);
});
