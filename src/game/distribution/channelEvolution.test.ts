import { expect, it } from "vitest";
import {
  acceptAllotment,
  advanceBookingChannels,
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

  expect(() => netChannelRevenueMinor(-1, 0)).toThrow(/gross revenue/);
  expect(() => netChannelRevenueMinor(1, 10_001)).toThrow(/commission/);
  expect(
    advanceBookingChannels(
      availableChannels({
        technologyAdoptionBp: {},
        hotelImplementations: new Set(),
        standardNetworkBp: 0,
      }),
    ).some((channel) => channel.id === "walkIn"),
  ).toBe(false);
  expect(
    availableChannels({
      technologyAdoptionBp: { internet: 9000 },
      hotelImplementations: new Set(["internet"]),
      standardNetworkBp: 9000,
    }).some((channel) => channel.id === "directWeb"),
  ).toBe(true);
});
