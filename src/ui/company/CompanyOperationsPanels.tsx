import { useState } from "react";
import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";
import type {
  treasuryView,
  acquisitionsView,
  headquartersView,
} from "./companyOperationsViewModel";
import type { DueDiligenceArea } from "../../game/ma/dueDiligence";
export function TreasuryPanel({
  view,
  onTransfer,
  locale = "en-GB",
}: {
  view: ReturnType<typeof treasuryView>;
  onTransfer: (
    hotelId: string,
    amountMinor: number,
    direction: "fund" | "sweep",
  ) => void;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  const [amount, setAmount] = useState(0);
  return (
    <section aria-label={t("companyOps.treasury.title")}>
      <h2>{t("companyOps.treasury.title")}</h2>
      <p>
        {t("companyOps.treasury.consolidated")}:{" "}
        {formatDm(view.consolidatedMinor, locale)}
      </p>
      {view.hotelCount > 1 ? (
        <>
          <p>
            {t("companyOps.treasury.hq")}: {formatDm(view.hqMinor, locale)}
          </p>
          <ul>
            {view.accounts.map((a) => (
              <li key={a.hotelId}>
                {a.hotelId}: {formatDm(a.balanceMinor, locale)}{" "}
                {view.overdrawn.includes(a.hotelId)
                  ? `— ${t("companyOps.treasury.overdrawn")}`
                  : ""}
                <input
                  aria-label={`${a.hotelId} ${t("companyOps.treasury.amount")}`}
                  type="number"
                  min="0"
                  onChange={(e) => setAmount(Number(e.currentTarget.value))}
                />
                <button
                  disabled={amount <= 0}
                  aria-describedby={
                    amount <= 0 ? `${a.hotelId}-reason` : undefined
                  }
                  onClick={() => onTransfer(a.hotelId, amount, "fund")}
                >
                  {t("companyOps.treasury.fund")}
                </button>
                <button
                  disabled={amount <= 0}
                  aria-describedby={
                    amount <= 0 ? `${a.hotelId}-reason` : undefined
                  }
                  onClick={() => onTransfer(a.hotelId, amount, "sweep")}
                >
                  {t("companyOps.treasury.sweep")}
                </button>
                {amount <= 0 ? (
                  <span id={`${a.hotelId}-reason`}>
                    {t("companyOps.treasury.enterAmount")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <ul>
            {Object.entries(view.exposure).map(([currency, value]) => (
              <li key={currency}>
                {currency}: {formatDm(value, locale)}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
export function AcquisitionsPanel({
  view,
  onDiligence,
  onAcquire,
  locale = "en-GB",
}: {
  view: ReturnType<typeof acquisitionsView>;
  onDiligence: (id: string, areas: DueDiligenceArea[]) => void;
  onAcquire: (id: string, price: number) => void;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  if (!view.length)
    return (
      <section aria-label={t("companyOps.ma.title")}>
        <h2>{t("companyOps.ma.title")}</h2>
        <p>{t("companyOps.ma.empty")}</p>
      </section>
    );
  return (
    <section aria-label={t("companyOps.ma.title")}>
      <h2>{t("companyOps.ma.title")}</h2>
      {view.map((x) => (
        <article key={x.id}>
          <h3>{x.name}</h3>
          <p>
            {t("companyOps.ma.asking")}: {formatDm(x.askingPriceMinor, locale)};{" "}
            {t("companyOps.ma.valuation")}:{" "}
            {formatDm(x.valuation.equityValueMinor, locale)};{" "}
            {t("companyOps.ma.offer")}: {formatDm(x.offer.lowMinor, locale)}–
            {formatDm(x.offer.highMinor, locale)}
          </p>
          <p>
            {t("companyOps.ma.debt")}: {formatDm(x.debtAssumedMinor, locale)};{" "}
            {t("companyOps.ma.renovation")}:{" "}
            {formatDm(x.renovationNeedMinor, locale)}
          </p>
          <p>
            {t("companyOps.ma.coverage")}:{" "}
            {(x.report?.areas ?? []).join(", ") || t("companyOps.ma.none")};{" "}
            {t("companyOps.ma.uncovered")}: {x.uncovered.join(", ")}
          </p>
          {x.report?.findings.map((f) => (
            <p key={`${f.area}:${f.description}`}>
              {f.area}: {f.description} — {formatDm(f.costMinor, locale)}
            </p>
          ))}
          <button
            onClick={() => onDiligence(x.id, [...x.uncovered])}
            disabled={!x.uncovered.length}
            aria-describedby={
              !x.uncovered.length ? `${x.id}-diligence-reason` : undefined
            }
          >
            {t("companyOps.ma.diligence")}
          </button>
          <button
            onClick={() => onAcquire(x.id, x.offer.midMinor)}
            disabled={x.status !== "available"}
            aria-describedby={
              x.status !== "available" ? `${x.id}-acquire-reason` : undefined
            }
          >
            {t("companyOps.ma.acquire")}
          </button>
          {!x.uncovered.length ? (
            <span id={`${x.id}-diligence-reason`}>
              {t("companyOps.ma.diligenceComplete")}
            </span>
          ) : null}
          {x.status !== "available" ? (
            <span id={`${x.id}-acquire-reason`}>
              {t("companyOps.ma.unavailable")}
            </span>
          ) : null}
        </article>
      ))}
    </section>
  );
}
export function HeadquartersPanel({
  view,
  locale = "en-GB",
}: {
  view: ReturnType<typeof headquartersView>;
  locale?: GameLocale;
}) {
  const t = (k: string) => translateGame(locale, k);
  return (
    <section aria-label={t("companyOps.hq.title")}>
      <h2>{t("companyOps.hq.title")}</h2>
      <p>
        {t("companyOps.hq.cost")}: {formatDm(view.totalMinor, locale)} (
        {formatDm(view.baseMinor, locale)} +{" "}
        {formatDm(view.perHotelMinor, locale)} {t("companyOps.hq.perHotel")})
      </p>
      {view.hotelCount > 1 ? (
        <>
          <p>
            {view.analysts} {t("companyOps.hq.analysts")}; {view.load.demand}/
            {view.load.capacity} {t("companyOps.hq.capacity")}
          </p>
          <p>
            {t("companyOps.hq.discount")}:{" "}
            {formatBasisPoints(view.discountBp, locale)}
          </p>
        </>
      ) : null}
    </section>
  );
}
