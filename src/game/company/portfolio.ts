import { compareIds } from "../domain/ids";

/**
 * The company layer above the hotels. A portfolio owns no operating rules of
 * its own: it records which houses belong to the group, which legal entity
 * holds each one, and which region reports it. Every hotel stays an
 * independent operating unit, so the group can grow without any hotel
 * learning that it is no longer alone.
 */
export interface CompanyPortfolio {
  companyId: string;
  /** Always in stable id order; processing must not depend on purchase order. */
  hotelIds: string[];
  hotelLegalEntity: Record<string, string>;
  /** Regional reporting line, when the group has grown one. */
  hotelRegion: Record<string, string>;
}

/** One hotel's place in the group, with nothing about its operation. */
export interface OperatingUnit {
  hotelId: string;
  legalEntityId: string;
  regionId?: string;
}

export function createPortfolio(companyId: string): CompanyPortfolio {
  if (!companyId) throw new Error("a company id is required");
  return { companyId, hotelIds: [], hotelLegalEntity: {}, hotelRegion: {} };
}

export function addHotelToPortfolio(
  portfolio: CompanyPortfolio,
  input: { hotelId: string; legalEntityId: string; regionId?: string },
): CompanyPortfolio {
  if (!input.hotelId) throw new Error("a hotel id is required");
  if (!input.legalEntityId)
    throw new Error("a hotel must be held by a legal entity");
  if (portfolio.hotelIds.includes(input.hotelId))
    throw new Error(`hotel ${input.hotelId} is already in the portfolio`);
  return {
    ...portfolio,
    hotelIds: [...portfolio.hotelIds, input.hotelId].sort(compareIds),
    hotelLegalEntity: {
      ...portfolio.hotelLegalEntity,
      [input.hotelId]: input.legalEntityId,
    },
    hotelRegion: input.regionId
      ? { ...portfolio.hotelRegion, [input.hotelId]: input.regionId }
      : { ...portfolio.hotelRegion },
  };
}

/**
 * Drops a divested house. Its own references go with it; every other hotel's
 * entity and region are left exactly as they were.
 */
export function removeHotelFromPortfolio(
  portfolio: CompanyPortfolio,
  hotelId: string,
): CompanyPortfolio {
  if (!portfolio.hotelIds.includes(hotelId))
    throw new Error(`hotel ${hotelId} is not in the portfolio`);
  const hotelLegalEntity = { ...portfolio.hotelLegalEntity };
  const hotelRegion = { ...portfolio.hotelRegion };
  delete hotelLegalEntity[hotelId];
  delete hotelRegion[hotelId];
  return {
    ...portfolio,
    hotelIds: portfolio.hotelIds.filter((id) => id !== hotelId),
    hotelLegalEntity,
    hotelRegion,
  };
}

export function setHotelRegion(
  portfolio: CompanyPortfolio,
  hotelId: string,
  regionId: string,
): CompanyPortfolio {
  if (!portfolio.hotelIds.includes(hotelId))
    throw new Error(`hotel ${hotelId} is not in the portfolio`);
  if (!regionId) throw new Error("a region id is required");
  return {
    ...portfolio,
    hotelRegion: { ...portfolio.hotelRegion, [hotelId]: regionId },
  };
}

export function hotelsInRegion(
  portfolio: CompanyPortfolio,
  regionId: string,
): string[] {
  return portfolio.hotelIds.filter(
    (id) => portfolio.hotelRegion[id] === regionId,
  );
}

export function operatingUnit(
  portfolio: CompanyPortfolio,
  hotelId: string,
): OperatingUnit | null {
  const legalEntityId = portfolio.hotelLegalEntity[hotelId];
  if (!portfolio.hotelIds.includes(hotelId) || !legalEntityId) return null;
  const regionId = portfolio.hotelRegion[hotelId];
  return regionId
    ? { hotelId, legalEntityId, regionId }
    : { hotelId, legalEntityId };
}
