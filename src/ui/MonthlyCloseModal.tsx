import { useEffect, useRef } from "react";
import type {
  BriefingItem,
  MonthlyCloseReport,
} from "../game/finance/monthlyClose";
import { translateGame, type GameLocale } from "../i18n";
import { formatBasisPoints, formatDm } from "./money";

function BriefingSection({
  headingKey,
  emptyKey,
  items,
  locale,
}: {
  headingKey: string;
  emptyKey: string;
  items: readonly BriefingItem[];
  locale: GameLocale;
}) {
  const heading = translateGame(locale, headingKey);
  return (
    <section aria-label={heading}>
      <h3>{heading}</h3>
      {items.length ? (
        <ol>
          {items.map((item, index) => (
            <li
              key={`${index}:${item.labelKey}`}
              data-direction={item.direction}
            >
              {translateGame(locale, item.labelKey, item.values)}
            </li>
          ))}
        </ol>
      ) : (
        <p>{translateGame(locale, emptyKey)}</p>
      )}
    </section>
  );
}

export function MonthlyCloseModal(props: {
  report: MonthlyCloseReport | null;
  onDismiss: () => void;
  locale?: GameLocale;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const locale = props.locale ?? "en-GB";

  useEffect(() => {
    const node = dialog.current;
    if (props.report && node && !node.open) node.showModal?.();
  }, [props.report]);

  const r = props.report;
  if (!r) return null;
  return (
    <dialog
      ref={dialog}
      aria-label={translateGame(locale, "finance.monthlyClose.title", {
        periodKey: r.periodKey,
      })}
      onClose={props.onDismiss}
    >
      <h2>
        {translateGame(locale, "finance.monthlyClose.title", {
          periodKey: r.periodKey,
        })}
      </h2>
      <BriefingSection
        headingKey="finance.monthlyClose.whatWentWell"
        emptyKey="finance.monthlyClose.emptyWell"
        items={r.whatWentWell}
        locale={locale}
      />
      <BriefingSection
        headingKey="finance.monthlyClose.whatWentBadly"
        emptyKey="finance.monthlyClose.emptyBadly"
        items={r.whatWentBadly}
        locale={locale}
      />
      <BriefingSection
        headingKey="finance.monthlyClose.whatIsChanging"
        emptyKey="finance.monthlyClose.emptyChanging"
        items={r.whatIsChanging}
        locale={locale}
      />
      <section aria-label="Revenue">
        <h3>{translateGame(locale, "finance.monthlyClose.evidence")}</h3>
        <dl>
          <dt>{translateGame(locale, "finance.monthlyClose.kpis.revenue")}</dt>
          <dd>{formatDm(r.revenueMinor, locale)}</dd>
          <dt>
            {translateGame(locale, "finance.monthlyClose.kpis.operatingProfit")}
          </dt>
          <dd>{formatDm(r.operatingProfitMinor, locale)}</dd>
          <dt>
            {translateGame(locale, "finance.monthlyClose.kpis.occupancy")}
          </dt>
          <dd>{formatBasisPoints(r.occupancyBasisPoints, locale)}</dd>
          <dt>{translateGame(locale, "finance.monthlyClose.kpis.adr")}</dt>
          <dd>{formatDm(r.adrMinor, locale)}</dd>
          <dt>{translateGame(locale, "finance.monthlyClose.kpis.revpar")}</dt>
          <dd>{formatDm(r.revParMinor, locale)}</dd>
        </dl>
      </section>
      <button type="button" onClick={() => dialog.current?.close()}>
        {translateGame(locale, "finance.monthlyClose.continue")}
      </button>
    </dialog>
  );
}
