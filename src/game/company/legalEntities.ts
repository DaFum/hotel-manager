import { compareIds } from "../domain/ids";
import type { CompanyPortfolio } from "./portfolio";

/**
 * The company that actually holds a hotel. Ownership models, tax abstraction
 * and currency exposure all hang off the entity rather than off the hotel, so
 * a house can change hands without changing how it is run.
 */
export interface LegalEntity {
  id: string;
  name: string;
  /** ISO-3166 alpha-2; the jurisdiction whose rules the entity reports under. */
  jurisdiction: string;
  /** The entity's reporting currency, as a content currency code. */
  currencyCode: string;
}

export function createLegalEntity(input: LegalEntity): LegalEntity {
  if (!input.id) throw new Error("a legal entity id is required");
  if (!input.name) throw new Error("a legal entity name is required");
  if (!/^[A-Z]{2}$/.test(input.jurisdiction))
    throw new Error(`invalid jurisdiction: ${input.jurisdiction}`);
  if (!input.currencyCode)
    throw new Error("a legal entity needs a reporting currency");
  return { ...input };
}

export function registerLegalEntity(
  entities: readonly LegalEntity[],
  entity: LegalEntity,
): LegalEntity[] {
  if (entities.some((e) => e.id === entity.id))
    throw new Error(`legal entity ${entity.id} is already registered`);
  return [...entities, entity].sort((a, b) => compareIds(a.id, b.id));
}

export function findLegalEntity(
  entities: readonly LegalEntity[],
  id: string,
): LegalEntity | null {
  return entities.find((e) => e.id === id) ?? null;
}

export function entityForHotel(
  entities: readonly LegalEntity[],
  portfolio: CompanyPortfolio,
  hotelId: string,
): LegalEntity | null {
  const entityId = portfolio.hotelLegalEntity[hotelId];
  return entityId ? findLegalEntity(entities, entityId) : null;
}
