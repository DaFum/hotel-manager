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
}) {
  return (
    <section aria-label="Commercial">
      <h2>Commercial</h2>

      <h3>Campaigns</h3>
      {props.campaigns.length === 0 ? (
        <p>Nothing is being advertised.</p>
      ) : (
        <ul>
          {props.campaigns.map((campaign) => (
            <li key={campaign.id}>
              {campaign.objective} on {campaign.channel} to{" "}
              {campaign.targetSegmentId} for {formatDm(campaign.budgetMinor)} —
              expected {formatBasisPoints(campaign.lowBasisPoints)} to{" "}
              {formatBasisPoints(campaign.highBasisPoints)} extra capture,{" "}
              {campaign.daysUntilAttribution > 0
                ? `${campaign.daysUntilAttribution} days before it shows`
                : "already showing"}{" "}
              ({campaign.status})
            </li>
          ))}
        </ul>
      )}

      <h3>Negotiated accounts</h3>
      {props.accounts.length === 0 ? (
        <p>No rate has been agreed with an account.</p>
      ) : (
        <ul>
          {props.accounts.map((account) => (
            <li key={account.id}>
              {account.accountName} at {formatDm(account.negotiatedRateMinor)}{" "}
              for {account.expectedRoomNights} room nights
              {account.concessions.length > 0
                ? `, plus ${account.concessions.join(", ")}`
                : ""}{" "}
              — {formatDm(account.profitabilityMinor)} over the year,{" "}
              {account.renewalIntent}
            </li>
          ))}
        </ul>
      )}

      <h3>Loyalty</h3>
      <p aria-label="Loyalty liability">
        {props.loyaltyMembers} members, {formatDm(props.loyaltyLiabilityMinor)}{" "}
        owed in points, {props.marketableGuests} guests who agreed to be
        contacted
      </p>

      <h3>Reputation</h3>
      <ul>
        {props.reputation.map((row) => (
          <li key={`${row.dimension}.${row.scopeId}`}>
            {row.dimension} ({row.scopeId}): {row.score}/100 — affects{" "}
            {row.effect}
            {row.topCause ? `; latest: ${row.topCause}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
