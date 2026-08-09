import { formatBasisPoints, formatDm } from "../money";

/**
 * Design intent (AGENTS §13)
 * - Purpose: answer "what is the city selling next month, and how sure are
 *   we?" before the player prices a single room.
 * - Tone: a 1991 market bulletin — sources listed like a ledger, the forecast
 *   quoted as a band, not a promise.
 * - Constraints: DOM-only and readable at any text size; no colour-only state.
 * - Differentiator: every number names the driver behind it, so a swing in
 *   demand can be traced to the actor that caused it rather than to luck.
 */
export function CityDashboard(p: {
  business: number;
  leisure: number;
  /** Congress and fair nights; absent before the city has organisers. */
  event?: number;
  /** Group and tour nights. */
  group?: number;
  /** Low and high bound of the room-night forecast. */
  low: number;
  high: number;
  /** Weighted transport reach, 0-100. */
  connectivityIndex?: number;
  /** How good the player's information is, 0-100. */
  informationQuality?: number;
  /** Cost and command callback are supplied together when research is available. */
  researchCostMinor?: number;
  onBuyResearch?: () => void;
}) {
  const event = p.event ?? 0;
  const group = p.group ?? 0;
  const total = p.business + p.leisure + event + group;
  const sources: readonly [string, number][] = [
    ["Business", p.business],
    ["Leisure", p.leisure],
    ["Event", event],
    ["Group", group],
  ];

  return (
    <section aria-label="City market">
      <h2>City market</h2>
      <p aria-label="City room nights">{total} room nights this month</p>
      <ul>
        {sources.map(([name, nights]) => (
          <li key={name}>
            {name} {nights} (
            {formatBasisPoints(
              total ? Math.round((nights * 10000) / total) : 0,
            )}
            )
          </li>
        ))}
      </ul>
      <p aria-label="Room-night forecast">
        Forecast {p.low}–{p.high} room nights
        {p.informationQuality === undefined
          ? ""
          : ` at information quality ${p.informationQuality}/100`}
      </p>
      {p.onBuyResearch === undefined ||
      p.researchCostMinor === undefined ? null : (
        <button type="button" onClick={p.onBuyResearch}>
          Buy market research — {formatDm(p.researchCostMinor)}
        </button>
      )}
      {p.connectivityIndex === undefined ? null : (
        <p aria-label="Connectivity">
          Connectivity {p.connectivityIndex}/100 — rail, air, road and local
          transit, weighted by how much travel each carries.
        </p>
      )}
    </section>
  );
}
