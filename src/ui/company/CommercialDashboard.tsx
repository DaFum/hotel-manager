import { translateGame, type GameLocale } from "../../i18n";
import { formatBasisPoints, formatDm } from "../money";

export interface CampaignRow {
  id: string;
  objective: string;
  channel: string;
  targetSegmentId: string;
  budgetMinor: number;
  status: string;
  /** The banded effect, because a single number would be a promise. */
  lowBasisPoints: number;
  highBasisPoints: number;
  /** Days until the work starts showing up in the numbers. */
  daysUntilAttribution: number;
}

export interface AccountRow {
  id: string;
  accountName: string;
  negotiatedRateMinor: number;
  expectedRoomNights: number;
  concessions: readonly string[];
  renewalIntent: string;
  profitabilityMinor: number;
}

export interface ReputationRow {
  dimension: string;
  scopeId: string;
  score: number;
  effect: string;
  topCause: string | null;
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: show what the hotel has bought, what it has promised, and what
 *   people think of it — three answers the player otherwise has to guess.
 * - Tone: a sales office wall — the account list is a ledger of promises, the
 *   campaign list a set of bets with their odds printed on them.
 * - Constraints: every reputation dimension is named with what it affects, so
 *   none of them reads as a generic score bar; no colour-only state.
 * - Differentiator: the campaign band and the attribution lag sit together, so
 *   the player can see why this month's numbers are last month's decisions.
 */
export function CommercialDashboard(props: {
  campaigns: readonly CampaignRow[];
  accounts: readonly AccountRow[];
  reputation: readonly ReputationRow[];
  loyaltyLiabilityMinor: number;
  loyaltyMembers: number;
  marketableGuests: number;
  locale?: GameLocale;
}) {
  const locale = props.locale ?? "en-GB";
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);

  return (
    <section aria-label={t("commercialDashboard.title")}>
      <h2>{t("commercialDashboard.title")}</h2>

      <h3>{t("commercialDashboard.campaigns")}</h3>
      {props.campaigns.length === 0 ? (
        <p>{t("commercialDashboard.noCampaigns")}</p>
      ) : (
        <ul>
          {props.campaigns.map((campaign) => (
            <li key={campaign.id}>
              {t("commercialDashboard.campaignRow", {
                objective: campaign.objective,
                channel: campaign.channel,
                targetSegmentId: campaign.targetSegmentId,
                budget: formatDm(campaign.budgetMinor, locale),
                low: formatBasisPoints(campaign.lowBasisPoints, locale),
                high: formatBasisPoints(campaign.highBasisPoints, locale),
                days:
                  campaign.daysUntilAttribution > 0
                    ? t("commercialDashboard.daysRemaining", {
                        count: campaign.daysUntilAttribution,
                      })
                    : t("commercialDashboard.alreadyShowing"),
                status: campaign.status,
              })}
            </li>
          ))}
        </ul>
      )}

      <h3>{t("commercialDashboard.accounts")}</h3>
      {props.accounts.length === 0 ? (
        <p>{t("commercialDashboard.noAccounts")}</p>
      ) : (
        <ul>
          {props.accounts.map((account) => (
            <li key={account.id}>
              {t("commercialDashboard.accountRow", {
                accountName: account.accountName,
                rate: formatDm(account.negotiatedRateMinor, locale),
                nights: account.expectedRoomNights,
                concessions:
                  account.concessions.length > 0
                    ? t("commercialDashboard.concessions", {
                        list: account.concessions.join(", "),
                      })
                    : "",
                profitability: formatDm(account.profitabilityMinor, locale),
                renewalIntent: account.renewalIntent,
              })}
            </li>
          ))}
        </ul>
      )}

      <h3>{t("commercialDashboard.loyalty")}</h3>
      <p aria-label={t("commercialDashboard.loyaltyLabel")}>
        {t("commercialDashboard.loyaltySummary", {
          members: props.loyaltyMembers,
          liability: formatDm(props.loyaltyLiabilityMinor, locale),
          marketable: props.marketableGuests,
        })}
      </p>

      <h3>{t("commercialDashboard.reputation")}</h3>
      <ul>
        {props.reputation.map((row) => (
          <li key={`${row.dimension}.${row.scopeId}`}>
            {t("commercialDashboard.reputationRow", {
              dimension: row.dimension,
              scopeId: row.scopeId,
              score: row.score,
              effect: row.effect,
              topCause: row.topCause
                ? t("commercialDashboard.latestCause", {
                    cause: row.topCause,
                  })
                : "",
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}
