import { formatDm } from "../money";
import { entityLabel } from "../entityNames";
import { useLocale } from "../localeContext";
import { translateGame, type GameLocale } from "../../i18n";

export interface CommercialSpaceRow {
  id: string;
  kind: string;
  capacity: number;
  openMinute: number;
  closeMinute: number;
  /** How the space is run: self-operated, let, or on a concession. */
  operator: string;
  /** What the hotel actually takes from it, given how it is run. */
  hotelShareMinor: number;
  unitsSold: number;
  fitBp: number;
}

export interface LobbyRow {
  served: number;
  unserved: number;
  cause: string;
  automation: readonly string[];
}

/** Midnight at the end of the day reads as 24:00, not as 00:00 again. */
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/**
 * Design intent (AGENTS §13)
 * - Purpose: show the parts of the hotel that are not bedrooms as a business,
 *   so letting a shop and running it are visibly different decisions.
 * - Tone: a letting schedule — hours, capacity and terms on one line, the way
 *   a property manager reads a building.
 * - Constraints: DOM-only, every constraint written in words, hours spelled
 *   out rather than implied by a bar.
 * - Differentiator: the operator model sits next to what the hotel actually
 *   takes, which is the whole trade the player is making.
 */
export function CommercialSpacesPanel(props: {
  spaces: readonly CommercialSpaceRow[];
  lobby: LobbyRow;
  locale?: GameLocale;
}) {
  const contextLocale = useLocale();
  const locale = props.locale ?? contextLocale;
  const t = (key: string, values: Record<string, string | number> = {}) =>
    translateGame(locale, key, values);
  return (
    <section aria-label={t("panels.commercial.title")}>
      <h2>{t("panels.commercial.title")}</h2>

      <h3>{t("panels.commercial.lobby")}</h3>
      <p aria-label={t("panels.commercial.lobbyLoad")}>
        {t("panels.commercial.lobbySummary", {
          served: props.lobby.served,
          waiting: props.lobby.unserved,
          cause: props.lobby.cause,
        })}
      </p>
      {props.lobby.automation.length === 0 ? (
        <p>{t("panels.commercial.deskOnly")}</p>
      ) : (
        <ul>
          {props.lobby.automation.map((mode) => (
            <li key={mode}>{mode}</li>
          ))}
        </ul>
      )}

      <h3>{t("panels.commercial.spaces")}</h3>
      {props.spaces.length === 0 ? (
        <p>{t("panels.commercial.none")}</p>
      ) : (
        <ul>
          {props.spaces.map((space) => (
            <li key={space.id}>
              {/* Name first, then the figures, rather than an identifier at
                  the head of a comma-separated run of eight readings. */}
              <strong>{entityLabel(space.id, locale)}</strong>{" "}
              <span>(
                {translateGame(
                  locale,
                  `entity.space.${space.kind}`,
                ) !== `entity.space.${space.kind}`
                  ? translateGame(locale, `entity.space.${space.kind}`)
                  : entityLabel(`space.${space.kind}`, locale)}
              )</span>
              <dl>
                <div>
                  <dt>{t("panels.commercial.capacity")}</dt>
                  <dd>
                    {t("panels.commercial.atATime", {
                      count: space.capacity,
                    })}
                  </dd>
                </div>
                <div>
                  <dt>{t("panels.commercial.open")}</dt>
                  <dd>
                    {clock(space.openMinute)}–{clock(space.closeMinute)}
                  </dd>
                </div>
                <div>
                  <dt>{t("panels.commercial.operator")}</dt>
                  <dd>
                    {t(`panels.commercial.operators.${space.operator}`)}
                  </dd>
                </div>
                <div>
                  <dt>{t("panels.commercial.soldThisMonth")}</dt>
                  <dd>{space.unitsSold}</dd>
                </div>
                <div>
                  <dt>{t("panels.commercial.toTheHotel")}</dt>
                  <dd>{formatDm(space.hotelShareMinor, locale)}</dd>
                </div>
                <div>
                  <dt>{t("panels.commercial.fit")}</dt>
                  <dd>
                    {t("panels.commercial.fitValue", {
                      value: space.fitBp / 100,
                    })}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
