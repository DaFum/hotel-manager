import type { BookingChannel } from "../bookings/bookingTypes";
export type EvolvingChannel =
  BookingChannel | "directWeb" | "ota" | "group" | "allotment";
export interface ChannelContext {
  technologyAdoptionBp: Readonly<Record<string, number>>;
  hotelImplementations: ReadonlySet<string>;
  standardNetworkBp: number;
}
export interface ChannelDefinition {
  id: EvolvingChannel;
  commissionBp: number;
  requiresTechnology?: string;
  requiresImplementation?: string;
  minimumNetworkBp?: number;
}
export const CHANNELS: readonly ChannelDefinition[] = [
  { id: "directPhone", commissionBp: 0 },
  { id: "travelAgency", commissionBp: 1000 },
  { id: "corporate", commissionBp: 500 },
  { id: "walkIn", commissionBp: 0 },
  {
    id: "directWeb",
    commissionBp: 200,
    requiresTechnology: "internet",
    requiresImplementation: "internet",
  },
  {
    id: "ota",
    commissionBp: 1800,
    requiresTechnology: "internet",
    requiresImplementation: "channel-manager",
    minimumNetworkBp: 3000,
  },
  { id: "group", commissionBp: 600 },
  { id: "allotment", commissionBp: 1200 },
];
export function availableChannels(
  context: ChannelContext,
): ChannelDefinition[] {
  return CHANNELS.filter(
    (channel) =>
      (!channel.requiresTechnology ||
        (context.technologyAdoptionBp[channel.requiresTechnology] ?? 0) >=
          3000) &&
      (!channel.requiresImplementation ||
        context.hotelImplementations.has(channel.requiresImplementation)) &&
      context.standardNetworkBp >= (channel.minimumNetworkBp ?? 0),
  );
}
export function advanceBookingChannels(
  channels: readonly ChannelDefinition[],
): ChannelDefinition[] {
  return channels.filter((channel) => channel.id !== "walkIn");
}
export function netChannelRevenueMinor(
  grossMinor: number,
  commissionBp: number,
): number {
  if (!Number.isSafeInteger(grossMinor) || grossMinor < 0)
    throw new Error("gross revenue must be non-negative whole minor units");
  if (
    !Number.isSafeInteger(commissionBp) ||
    commissionBp < 0 ||
    commissionBp > 10_000
  )
    throw new Error("commission must be 0..10000 basis points");
  const net = Number(
    (BigInt(grossMinor) * BigInt(10_000 - commissionBp) + 5_000n) / 10_000n,
  );
  if (!Number.isSafeInteger(net)) throw new Error("net revenue overflow");
  return net;
}
export function sharedAvailableRooms(
  totalRooms: number,
  heldByDate: Readonly<Record<string, number>>,
  dateKeys: readonly string[],
  overbookingLimitRooms = 0,
): number {
  return Math.min(
    ...dateKeys.map(
      (date) => totalRooms + overbookingLimitRooms - (heldByDate[date] ?? 0),
    ),
  );
}
export function acceptAllotment(
  totalRooms: number,
  heldRooms: number,
  allotmentRooms: number,
): boolean {
  return heldRooms + allotmentRooms <= totalRooms;
}
