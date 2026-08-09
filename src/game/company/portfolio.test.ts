import { describe, expect, it } from "vitest";
import {
  addHotelToPortfolio,
  createPortfolio,
  hotelsInRegion,
  operatingUnit,
  removeHotelFromPortfolio,
  setHotelRegion,
} from "./portfolio";
import {
  createLegalEntity,
  entityForHotel,
  registerLegalEntity,
} from "./legalEntities";

describe("company portfolio", () => {
  it("keeps hotels as separate operating units under one company", () => {
    const base = createPortfolio("company.player");
    const next = addHotelToPortfolio(base, {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
    });
    expect(next.hotelIds).toEqual(["hotel.frankfurt.1"]);
    expect(next.hotelLegalEntity["hotel.frankfurt.1"]).toBe("entity.de.1");
  });

  it("refuses to add the same hotel twice", () => {
    const one = addHotelToPortfolio(createPortfolio("company.player"), {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
    });
    expect(() =>
      addHotelToPortfolio(one, {
        hotelId: "hotel.frankfurt.1",
        legalEntityId: "entity.de.2",
      }),
    ).toThrow(/already/);
  });

  it("orders hotel ids stably so processing does not depend on insertion", () => {
    let portfolio = createPortfolio("company.player");
    portfolio = addHotelToPortfolio(portfolio, {
      hotelId: "hotel.munich.1",
      legalEntityId: "entity.de.1",
    });
    portfolio = addHotelToPortfolio(portfolio, {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
    });
    expect(portfolio.hotelIds).toEqual(["hotel.frankfurt.1", "hotel.munich.1"]);
  });

  it("records a region per hotel and can list a region's houses", () => {
    let portfolio = addHotelToPortfolio(createPortfolio("company.player"), {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
      regionId: "region.de.west",
    });
    portfolio = addHotelToPortfolio(portfolio, {
      hotelId: "hotel.munich.1",
      legalEntityId: "entity.de.1",
    });
    expect(hotelsInRegion(portfolio, "region.de.west")).toEqual([
      "hotel.frankfurt.1",
    ]);
    portfolio = setHotelRegion(portfolio, "hotel.munich.1", "region.de.west");
    expect(hotelsInRegion(portfolio, "region.de.west")).toEqual([
      "hotel.frankfurt.1",
      "hotel.munich.1",
    ]);
  });

  it("describes one hotel as a self-contained operating unit", () => {
    const portfolio = addHotelToPortfolio(createPortfolio("company.player"), {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
      regionId: "region.de.west",
    });
    expect(operatingUnit(portfolio, "hotel.frankfurt.1")).toEqual({
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
      regionId: "region.de.west",
    });
    expect(operatingUnit(portfolio, "hotel.nowhere")).toBeNull();
  });

  it("removes a divested hotel and forgets only its own references", () => {
    let portfolio = addHotelToPortfolio(createPortfolio("company.player"), {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
      regionId: "region.de.west",
    });
    portfolio = addHotelToPortfolio(portfolio, {
      hotelId: "hotel.munich.1",
      legalEntityId: "entity.de.1",
    });
    const after = removeHotelFromPortfolio(portfolio, "hotel.frankfurt.1");
    expect(after.hotelIds).toEqual(["hotel.munich.1"]);
    expect(after.hotelLegalEntity["hotel.frankfurt.1"]).toBeUndefined();
    expect(after.hotelRegion["hotel.frankfurt.1"]).toBeUndefined();
    expect(after.hotelLegalEntity["hotel.munich.1"]).toBe("entity.de.1");
  });
});

describe("portfolio refusals", () => {
  it("refuses a company with no id", () => {
    expect(() => createPortfolio("")).toThrow(/company id/);
  });

  it("refuses to divest a hotel the group never held", () => {
    expect(() =>
      removeHotelFromPortfolio(createPortfolio("company.player"), "hotel.none"),
    ).toThrow(/not in the portfolio/);
  });

  it("refuses a region for an unknown hotel, or a region with no id", () => {
    const portfolio = addHotelToPortfolio(createPortfolio("company.player"), {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
    });
    expect(() =>
      setHotelRegion(portfolio, "hotel.none", "region.de.west"),
    ).toThrow(/not in the portfolio/);
    expect(() => setHotelRegion(portfolio, "hotel.frankfurt.1", "")).toThrow(
      /region id/,
    );
  });
});

describe("legal entities", () => {
  it("holds hotels in a jurisdiction with its own reporting currency", () => {
    const entity = createLegalEntity({
      id: "entity.de.1",
      name: "Rheinstern Betriebs GmbH",
      jurisdiction: "DE",
      currencyCode: "DEM",
    });
    expect(entity.currencyCode).toBe("DEM");
    expect(entity.jurisdiction).toBe("DE");
  });

  it("refuses an entity without a stable id", () => {
    expect(() =>
      createLegalEntity({
        id: "",
        name: "Nameless",
        jurisdiction: "DE",
        currencyCode: "DEM",
      }),
    ).toThrow(/id/);
  });

  it("refuses a jurisdiction that is not two capital letters", () => {
    for (const jurisdiction of ["D", "DEU", "de", "D1", ""])
      expect(() =>
        createLegalEntity({
          id: "entity.de.1",
          name: "Rheinstern",
          jurisdiction,
          currencyCode: "DEM",
        }),
      ).toThrow(/jurisdiction/);
  });

  it("refuses to register the same entity id twice", () => {
    const one = registerLegalEntity(
      [],
      createLegalEntity({
        id: "entity.de.1",
        name: "A",
        jurisdiction: "DE",
        currencyCode: "DEM",
      }),
    );
    expect(() =>
      registerLegalEntity(
        one,
        createLegalEntity({
          id: "entity.de.1",
          name: "B",
          jurisdiction: "DE",
          currencyCode: "DEM",
        }),
      ),
    ).toThrow(/already/);
  });

  it("resolves the entity that owns a hotel through the portfolio", () => {
    const entities = registerLegalEntity(
      [],
      createLegalEntity({
        id: "entity.de.1",
        name: "Rheinstern Betriebs GmbH",
        jurisdiction: "DE",
        currencyCode: "DEM",
      }),
    );
    const portfolio = addHotelToPortfolio(createPortfolio("company.player"), {
      hotelId: "hotel.frankfurt.1",
      legalEntityId: "entity.de.1",
    });
    expect(entityForHotel(entities, portfolio, "hotel.frankfurt.1")?.name).toBe(
      "Rheinstern Betriebs GmbH",
    );
    expect(entityForHotel(entities, portfolio, "hotel.nowhere")).toBeNull();
  });
});
