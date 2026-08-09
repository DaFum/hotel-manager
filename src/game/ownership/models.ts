import { assertBasisPoints, assertNonNegativeMinor } from "../domain/units";

/**
 * How the group holds a hotel. The four models differ in exactly three ways:
 * who owns the building, who may invest in it, and what the contract costs
 * every month. Everything else about running the house is identical, which is
 * why the operating model is a contract and not a second kind of hotel.
 */
export type OperatingModel =
  | { kind: "owned" }
  | { kind: "lease"; monthlyRentMinor: number }
  | { kind: "management"; managementFeeBasisPoints: number }
  | { kind: "franchise"; royaltyBasisPoints: number };

export type OperatingModelKind = OperatingModel["kind"];

/** A contract flow named by the account it belongs in, in signed Pfennig. */
export interface OwnershipPosting {
  account: "leaseRent" | "managementFee" | "franchiseRoyalty";
  amountMinor: number;
  memo: string;
}

/** Validates declared terms once, at the boundary where a contract is signed. */
export function createOperatingContract(model: OperatingModel): OperatingModel {
  switch (model.kind) {
    case "owned":
      return { kind: "owned" };
    case "lease":
      assertNonNegativeMinor(model.monthlyRentMinor, "monthly lease rent");
      return { ...model };
    case "management":
      assertFeeBasisPoints(model.managementFeeBasisPoints, "management fee");
      return { ...model };
    case "franchise":
      assertFeeBasisPoints(model.royaltyBasisPoints, "franchise royalty");
      return { ...model };
  }
}

function assertFeeBasisPoints(value: number, label: string): number {
  assertBasisPoints(value, label);
  // A contract fee above the whole of the revenue it is charged on is a
  // typo, not a deal; refusing it here keeps the ledger sane.
  if (value > 10_000) throw new Error(`invalid ${label}`);
  return value;
}

/**
 * The month's contract flows, as signed Pfennig against the group's cash.
 * A management fee is income because the group is the operator being paid;
 * rent and royalty are outgoings because the group is the one paying.
 */
/**
 * The same flows, each named by its account. The ledger needs to keep rent,
 * fee and royalty apart: they behave differently when the model changes, and
 * collapsing them into "contract cost" would make a rebranding invisible.
 */
export function monthlyOwnershipPostings(
  model: OperatingModel,
  roomRevenueMinor: number,
): OwnershipPosting[] {
  assertNonNegativeMinor(roomRevenueMinor, "room revenue");
  switch (model.kind) {
    case "owned":
      return [];
    case "lease":
      return [
        {
          account: "leaseRent",
          amountMinor: -assertNonNegativeMinor(
            model.monthlyRentMinor,
            "monthly lease rent",
          ),
          memo: "lease rent",
        },
      ];
    case "management":
      return [
        {
          account: "managementFee",
          amountMinor: feeMinor(
            roomRevenueMinor,
            model.managementFeeBasisPoints,
            "management fee",
          ),
          memo: "management fee",
        },
      ];
    case "franchise":
      return [
        {
          account: "franchiseRoyalty",
          amountMinor: -feeMinor(
            roomRevenueMinor,
            model.royaltyBasisPoints,
            "franchise royalty",
          ),
          memo: "franchise royalty",
        },
      ];
  }
}

/** Truncated so a fee never rounds up into money the contract does not owe. */
function feeMinor(baseMinor: number, bp: number, label: string): number {
  assertFeeBasisPoints(bp, label);
  const quotient = Math.trunc(baseMinor / 10_000);
  const remainder = baseMinor % 10_000;
  return quotient * bp + Math.trunc((remainder * bp) / 10_000);
}

/** Only an owner holds the building; the rest hold a contract over it. */
export function ownsRealEstate(model: OperatingModel): boolean {
  return model.kind === "owned";
}

/**
 * Whether the group may commit capital to the asset. A lessee and a
 * franchisee invest in a house they do not own; a management operator spends
 * the owner's money and must escalate instead.
 */
export function controlsCapex(model: OperatingModel): boolean {
  return model.kind !== "management";
}
