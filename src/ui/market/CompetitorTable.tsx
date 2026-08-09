import type { Strategy } from "../../game/competitors/strategies";
import type { LifecycleAction } from "../../game/competitors/lifecycle";
import { strategyProfile } from "../../game/competitors/strategies";
import { formatBasisPoints, formatDm } from "../money";
import { translate } from "../localization";

export interface CompetitorRow {
  id: string;
  name: string;
  strategy: Strategy;
  rooms: number;
  rateMinor: number;
  occupancyBp: number;
  status: LifecycleAction;
}

const STATUS_WORDS: Record<LifecycleAction, string> = {
  operate: "trading",
  restructure: "restructuring",
  exit: "leaving the market",
};

/**
 * Design intent (AGENTS §13)
 * - Purpose: let the player see, in one glance, whether they are the dear
 *   house or the cheap one, and which rival is about to be in trouble.
 * - Tone: a hotelier's competitive set sheet, this hotel on the same rows as
 *   the rivals rather than in a separate summary box.
 * - Constraints: a real table with headers, so screen readers and sighted
 *   readers get the same comparison; state is written in words.
 * - Differentiator: every rival row says where it sits against this hotel,
 *   so the number and its meaning never live apart.
 */
export function CompetitorTable(props: {
  rows: readonly CompetitorRow[];
  playerRateMinor: number;
  playerOccupancyBp: number;
}) {
  if (props.rows.length === 0)
    return (
      <section aria-label="Competitors">
        <h2>Competitors</h2>
        <p>There are no other hotels trading in this city.</p>
      </section>
    );

  const position = (rateMinor: number) => {
    const deltaBp = Math.round(
      ((rateMinor - props.playerRateMinor) * 10000) / props.playerRateMinor,
    );
    if (deltaBp > 250) return `${formatBasisPoints(deltaBp)} above this hotel`;
    if (deltaBp < -250)
      return `${formatBasisPoints(-deltaBp)} below this hotel`;
    return "level with this hotel";
  };

  return (
    <section aria-label="Competitors">
      <h2>Competitors</h2>
      <table>
        <caption>Competitors in this city</caption>
        <thead>
          <tr>
            <th scope="col">Hotel</th>
            <th scope="col">Strategy</th>
            <th scope="col">Rooms</th>
            <th scope="col">Rate</th>
            <th scope="col">Occupancy</th>
            <th scope="col">Position</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">This hotel</th>
            <td>Player</td>
            <td>—</td>
            <td>{formatDm(props.playerRateMinor)}</td>
            <td>{formatBasisPoints(props.playerOccupancyBp)}</td>
            <td>—</td>
            <td>trading</td>
          </tr>
          {props.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.name}</th>
              <td>{translate(strategyProfile(r.strategy).nameKey)}</td>
              <td>{r.rooms}</td>
              <td>{formatDm(r.rateMinor)}</td>
              <td>{formatBasisPoints(r.occupancyBp)}</td>
              <td>{position(r.rateMinor)}</td>
              <td>{STATUS_WORDS[r.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
