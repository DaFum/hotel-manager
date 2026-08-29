import { useEffect, useRef } from "react";
import { entityLabel } from "../entityNames";
import { translateGame, type GameLocale } from "../../i18n";
import { groupByFloor } from "../../render/sceneLayout";
import { renovationPhaseKey, type RenovationPhase } from "../localization";

export interface SemanticRoom {
  id: string;
  label?: string;
  category?: string;
  state: string;
  cleanliness?: number;
  guestLabel?: string;
  rateLabel?: string;
  conditionKey?: string;
  problemKeys?: string[];
  problemLabels?: string[];
  renovationPhase?: RenovationPhase;
  faultReasonKey?: string;
}
/**
 * The house as a list. This is not a fallback for the canvas — it is the
 * accessible half of the same view, and it is grouped by floor for the same
 * reason the world is: a hotel is read floor by floor, by anyone reading it.
 */
export function SemanticHotelTree({
  rooms,
  onInspect,
  floorByRoomId,
  focusedId,
  locale = "en-GB",
}: {
  rooms: readonly SemanticRoom[];
  onInspect: (id: string) => void;
  floorByRoomId?: Readonly<Record<string, number>>;
  focusedId?: string | null;
  locale?: GameLocale;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!focusedId) return;
    const item = [
      ...(root.current?.querySelectorAll<HTMLElement>("[data-entity-id]") ??
        []),
    ].find((candidate) => candidate.dataset.entityId === focusedId);
    if (!item) return;
    item.scrollIntoView?.({ block: "nearest" });
    item.querySelector<HTMLButtonElement>("button")?.focus();
  }, [focusedId]);

  const floors = groupByFloor(rooms, floorByRoomId);
  return (
    <section ref={root} aria-label={translateGame(locale, "hotel.status")}>
      <h2>{translateGame(locale, "hotel.status")}</h2>
      {/* One scrolling frame around the whole house: a cap per floor would
          clip every storey's last room instead of bounding the list. */}
      <div className="hm-register">
        {floors.map(([floor, floorRooms]) => (
          <div key={floor}>
            {floorByRoomId === undefined ? null : (
              <h3>{translateGame(locale, "room.floor", { value: floor })}</h3>
            )}
            <ul>
              {floorRooms.map((room) => {
                const detailId = `semantic-${room.id.replace(/[^a-z0-9_-]/gi, "-")}-detail`;
                // A room is called by its number and its kind — "Room 101,
                // single" — never by the identifier the simulation files it
                // under, which is what `room.101 single` was showing forty
                // times per floor.
                const categoryLabel =
                  room.category &&
                  ["single", "double", "suite"].includes(room.category)
                    ? translateGame(locale, `revenue.category.${room.category}`)
                    : translateGame(locale, "room.fallback");
                const label =
                  room.label ??
                  `${entityLabel(room.id, locale)}, ${categoryLabel}`;
                const state = translateGame(
                  locale,
                  `room.states.${room.state}`,
                );
                const problems =
                  room.problemLabels ??
                  (room.problemKeys ?? []).map((key) =>
                    translateGame(locale, key),
                  );
                return (
                  // The state marker lets the eye find the dirty and the out-of-order
                  // rooms; the state is written out in words on the same line.
                  <li
                    key={room.id}
                    data-room-state={room.state}
                    data-entity-id={room.id}
                  >
                    <span>
                      {label}: {state}
                      {room.cleanliness === undefined
                        ? ""
                        : `, ${translateGame(locale, "room.cleanliness", { value: room.cleanliness })}`}
                    </span>{" "}
                    <dl id={detailId} className="sr-only">
                      <dt>{translateGame(locale, "room.detail.occupancy")}</dt>
                      <dd>
                        {translateGame(
                          locale,
                          room.guestLabel
                            ? "room.detail.occupied"
                            : "room.detail.vacant",
                        )}
                      </dd>
                      <dt>{translateGame(locale, "room.detail.guest")}</dt>
                      <dd>
                        {room.guestLabel ??
                          translateGame(locale, "room.detail.none")}
                      </dd>
                      <dt>{translateGame(locale, "room.detail.rate")}</dt>
                      <dd>
                        {room.rateLabel ??
                          translateGame(locale, "room.detail.notPriced")}
                      </dd>
                      <dt>{translateGame(locale, "room.detail.condition")}</dt>
                      <dd>
                        {translateGame(
                          locale,
                          room.conditionKey ?? "room.condition.serviceable",
                        )}
                      </dd>
                      <dt>
                        {translateGame(locale, "room.detail.cleanliness")}
                      </dt>
                      <dd>
                        {room.cleanliness ??
                          translateGame(locale, "room.detail.none")}
                      </dd>
                      {room.renovationPhase ? (
                        <>
                          <dt>
                            {translateGame(
                              locale,
                              "room.detail.renovationPhase",
                            )}
                          </dt>
                          <dd>
                            {translateGame(
                              locale,
                              renovationPhaseKey(room.renovationPhase),
                            )}
                          </dd>
                        </>
                      ) : null}
                      {room.faultReasonKey ? (
                        <>
                          <dt>
                            {translateGame(locale, "room.detail.faultReason")}
                          </dt>
                          <dd>{translateGame(locale, room.faultReasonKey)}</dd>
                        </>
                      ) : null}
                      <dt>
                        {translateGame(locale, "room.detail.openProblems")}
                      </dt>
                      <dd>
                        {problems.length
                          ? problems.join(", ")
                          : translateGame(locale, "room.problems.none")}
                      </dd>
                    </dl>
                    <button
                      type="button"
                      onClick={() => onInspect(room.id)}
                      aria-describedby={detailId}
                      aria-label={`${translateGame(locale, "hotel.inspect")} ${label} ${state}`}
                    >
                      {translateGame(locale, "hotel.inspect")}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
