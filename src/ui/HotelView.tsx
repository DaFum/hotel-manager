import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SemanticHotelTree } from "./accessibility/SemanticHotelTree";
import { roomConcern } from "../render/sceneLayout";
import { formatDm } from "./money";
import { dragCamera, wheelZoom, type CameraState } from "../render/camera";
import type { VisualAgent } from "../render/agentMaterialization";
import type { ElevatorVisualState } from "../render/agentMaterialization";
import { entityLabel } from "./entityNames";
import { translateGame, type GameLocale } from "../i18n";
import type { RoomOccupantRef } from "../game/simulation/initialState";
import type { Phase as RenovationPhase } from "../game/renovation/projects";
import type { FloorPlan } from "../game/building/floorPlan";
import type { OperationalSituationDescriptors } from "../game/building/operationalSituations";
import {
  guestIdentityCode,
  agentStatusKey,
  facilityCauseKey,
  renovationPhaseKey,
  roomConditionKey,
} from "./localization";

export interface HotelViewRoom {
  id: string;
  category: string;
  state: string;
  cleanliness: number;
  /** The room product this module is fitted out to, when the snapshot says. */
  moduleId?: string;
  /** Years since the fit-out was current; only a renovation resets it. */
  styleAgeYears?: number;
}

/** Who is in a room tonight, as far as the isometric view needs to know. */
export interface HotelViewStay {
  roomId: string;
  bookingId: string;
  rateMinor: number;
  departureDateKey: string;
}

export interface HotelViewFacility {
  id: string;
  name: string;
  demand: number;
  capacity: number;
  cause: string;
}

interface SceneModel {
  rooms: readonly HotelViewRoom[];
  facilities: readonly HotelViewFacility[];
  agents: readonly VisualAgent[];
  floorByRoomId: Readonly<Record<string, number>>;
  positionByEntityId?: Readonly<
    Record<string, { floor: number; gridX: number; gridY: number }>
  >;
  floorPlan?: FloorPlan;
  closedNavigationIds?: readonly string[];
  elevator?: ElevatorVisualState;
  situations?: OperationalSituationDescriptors;
  renovationPhaseByRoomId: Readonly<Record<string, RenovationPhase>>;
  camera?: CameraState;
  selectedId: string | null;
  minuteOfDay: number;
}

interface PixiScene {
  render: (model: SceneModel) => void;
  onRoomSelected: (handler: (roomId: string) => void) => void;
  onAgentSelected: (handler: (agentId: string) => void) => void;
  destroy: () => void;
}

export function humanRoomState(state: string): string {
  return state.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

/**
 * What is outstanding in a room, said in words. The scene marks the same
 * rooms; this is the half a screen reader can read and the half that says why.
 */
export function roomProblems(
  room: HotelViewRoom,
  renovationPhaseByRoomId: Readonly<Record<string, RenovationPhase>> = {},
): { key: string; values?: Record<string, string | number> }[] {
  const problems: { key: string; values?: Record<string, string | number> }[] =
    [];
  const phase = renovationPhaseByRoomId[room.id];
  if (phase) {
    problems.push({ key: `room.problems.renovation.${phase}` });
    return problems;
  }
  const concern = roomConcern(room.state, room.cleanliness);
  if (concern === "out-of-service") {
    problems.push({
      key: "room.problems.outOfService",
      values: { state: `room.states.${room.state}` },
    });
  } else if (concern === "needs-cleaning") {
    problems.push({
      key: "room.problems.needsCleaning",
      values: { cleanliness: room.cleanliness },
    });
  }
  return problems;
}

export function HotelView(props: {
  /**
   * The controls that drive this view — panning, zoom, floors, layers. They
   * belong beside the picture they move, not fifteen hundred pixels below it
   * at the bottom of the department, which is where they were.
   */
  controls?: ReactNode;
  rooms: readonly HotelViewRoom[];
  facilities?: readonly HotelViewFacility[];
  agents?: readonly VisualAgent[];
  floorByRoomId?: Readonly<Record<string, number>>;
  positionByEntityId?: Readonly<
    Record<string, { floor: number; gridX: number; gridY: number }>
  >;
  floorPlan?: FloorPlan;
  closedNavigationIds?: readonly string[];
  elevator?: ElevatorVisualState;
  situations?: OperationalSituationDescriptors;
  camera?: CameraState;
  minuteOfDay?: number;
  stays?: readonly HotelViewStay[];
  /** Tonight's rate for a category, in minor units, keyed by category. */
  rateByCategory?: Readonly<Record<string, number>>;
  /** Active phase per affected room, projected by the worker. */
  renovationPhaseByRoomId?: Readonly<Record<string, RenovationPhase>>;
  occupantByRoomId?: Readonly<Record<string, RoomOccupantRef>>;
  onSelect?: (roomId: string) => void;
  onSelectFacility?: (facilityId: string) => void;
  onSelectAgent?: (agentId: string) => void;
  /** Moving the view; the world controls move the very same camera. */
  onCamera?: (camera: CameraState) => void;
  /** Entity the camera just reached; rooms receive equivalent DOM focus. */
  focusedEntityId?: string | null;
  disableRenderer?: boolean;
  locale?: GameLocale;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewRoot = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const scene = useRef<PixiScene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  const selectRoom = useRef<(roomId: string) => void>(() => {});
  const selectAgent = useRef<(agentId: string) => void>(() => {});

  useEffect(() => {
    if (props.disableRenderer) return;
    let cancelled = false;
    void (async () => {
      try {
        const { PixiHotelScene } = await import("../render/PixiHotelScene");
        const created = new PixiHotelScene();
        await created.attach(host.current!);
        if (cancelled) return created.destroy();
        created.onRoomSelected((roomId) => {
          setSelected(roomId);
          selectRoom.current(roomId);
        });
        created.onAgentSelected((agentId) => {
          setSelectedAgent(agentId);
          selectAgent.current(agentId);
        });
        scene.current = created;
        setSceneReady(true);
      } catch {
        /* no renderer available */
      }
    })();
    return () => {
      cancelled = true;
      scene.current?.destroy();
      scene.current = null;
      setSceneReady(false);
    };
  }, [props.disableRenderer]);

  useEffect(() => {
    if (!sceneReady) return;
    scene.current?.render({
      rooms: props.rooms,
      facilities: props.facilities ?? [],
      agents: props.agents ?? [],
      floorByRoomId: props.floorByRoomId ?? {},
      positionByEntityId: props.positionByEntityId,
      floorPlan: props.floorPlan,
      closedNavigationIds: props.closedNavigationIds,
      elevator: props.elevator,
      situations: props.situations,
      renovationPhaseByRoomId: props.renovationPhaseByRoomId ?? {},
      camera: props.camera,
      selectedId: selected,
      minuteOfDay: props.minuteOfDay ?? 720,
    });
  }, [
    props.rooms,
    props.facilities,
    props.agents,
    props.floorByRoomId,
    props.positionByEntityId,
    props.floorPlan,
    props.closedNavigationIds,
    props.elevator,
    props.situations,
    props.renovationPhaseByRoomId,
    props.camera,
    props.minuteOfDay,
    selected,
    sceneReady,
  ]);

  const drag = useRef<{ x: number; y: number } | null>(null);
  const cameraRef = useRef(props.camera);

  const moveCamera = useRef<(camera: CameraState) => void>(() => {});
  useLayoutEffect(() => {
    selectRoom.current = (roomId: string) => props.onSelect?.(roomId);
    selectAgent.current = (agentId: string) => props.onSelectAgent?.(agentId);
    cameraRef.current = props.camera;
    moveCamera.current = (camera: CameraState) => props.onCamera?.(camera);
  });

  useEffect(() => {
    const node = host.current;
    if (!node || !props.onCamera) return;
    const onWheel = (event: WheelEvent) => {
      const camera = cameraRef.current;
      if (!camera) return;
      event.preventDefault();
      moveCamera.current(wheelZoom(camera, event.deltaY));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [props.onCamera]);

  useEffect(() => {
    if (!props.focusedEntityId) return;
    const entity = [
      ...(viewRoot.current?.querySelectorAll<HTMLElement>("[data-entity-id]") ??
        []),
    ].find((candidate) => candidate.dataset.entityId === props.focusedEntityId);
    if (!entity) return;
    entity.scrollIntoView?.({ block: "nearest" });
    const button = entity.querySelector<HTMLButtonElement>("button");
    if (button) button.focus();
    else entity.focus();
  }, [props.focusedEntityId]);

  const detail = props.rooms.find((r) => r.id === selected);
  const facilityDetail = (props.facilities ?? []).find(
    (facility) => facility.id === selectedFacility,
  );
  const agentDetail = (props.agents ?? []).find(
    (agent) => agent.id === selectedAgent,
  );
  const stay = detail
    ? (props.stays ?? []).find((s) => s.roomId === detail.id)
    : undefined;
  const occupant:
    (Omit<RoomOccupantRef, "guestId"> & { guestId?: string }) | undefined =
    detail
      ? (props.occupantByRoomId?.[detail.id] ??
        (stay
          ? {
              bookingId: stay.bookingId,
              rateMinor: stay.rateMinor,
              departureDateKey: stay.departureDateKey,
            }
          : undefined))
      : undefined;
  const rateMinor = detail
    ? (occupant?.rateMinor ?? props.rateByCategory?.[detail.category])
    : undefined;
  const problems = detail
    ? roomProblems(detail, props.renovationPhaseByRoomId)
    : [];
  const locale = props.locale ?? "en-GB";
  const roomFaultReasonByRoomId =
    props.situations?.roomFaultReasonByRoomId ?? {};
  const semanticRooms = props.rooms.map((room) => {
    const roomOccupant = props.occupantByRoomId?.[room.id];
    const phase = props.renovationPhaseByRoomId?.[room.id];
    const roomProblemLabels = roomProblems(
      room,
      props.renovationPhaseByRoomId,
    ).map((problem) => translateGame(locale, problem.key, problem.values));
    return {
      ...room,
      guestLabel: roomOccupant
        ? translateGame(locale, "room.guestLabel", {
            code: guestIdentityCode(roomOccupant.guestId),
          })
        : undefined,
      rateLabel:
        roomOccupant?.rateMinor !== undefined
          ? formatDm(roomOccupant.rateMinor, locale)
          : props.rateByCategory?.[room.category] !== undefined
            ? formatDm(props.rateByCategory[room.category], locale)
            : undefined,
      conditionKey: roomConditionKey(room.state),
      problemLabels: roomProblemLabels,
      renovationPhase: phase,
      faultReasonKey: roomFaultReasonByRoomId[room.id],
    };
  });

  return (
    <section ref={viewRoot} aria-label="Hotel view" className="hm-hotel-view">
      {/* The stage: the building and the controls that move it, side by side,
          so choosing a floor or a layer never means scrolling away from the
          thing it changes. */}
      <div className="hm-hotel-view__stage">
        <div
          className="hm-canvas"
          ref={host}
          data-testid="hotel-canvas"
          onPointerDown={(event) => {
            if (!props.onCamera) return;
            drag.current = { x: event.clientX, y: event.clientY };
            if (event.currentTarget.setPointerCapture)
              event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const from = drag.current;
            const camera = cameraRef.current;
            if (!from || !camera) return;
            const dx = event.clientX - from.x;
            const dy = event.clientY - from.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
              drag.current = { x: event.clientX, y: event.clientY };
              moveCamera.current(dragCamera(camera, { x: dx, y: dy }));
            }
          }}
          onPointerUp={(event) => {
            drag.current = null;
            if (event.currentTarget.releasePointerCapture)
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        />
        {props.controls ? (
          <div className="hm-hotel-view__controls">{props.controls}</div>
        ) : null}
      </div>

      <SemanticHotelTree
        locale={props.locale}
        floorByRoomId={props.floorByRoomId}
        focusedId={props.focusedEntityId}
        rooms={semanticRooms}
        onInspect={(roomId) => {
          setSelected(roomId);
          props.onSelect?.(roomId);
        }}
      />

      <div className="hm-hotel-view__grid">
        {props.floorPlan ? (
          <details className="hm-card hm-card--collapsible">
            <summary>
              {translateGame(locale, "hotel.buildingStructure")}
            </summary>
            <h3>{translateGame(locale, "hotel.placedAreas")}</h3>
            <ul>
              {props.floorPlan.areas.map((area) => (
                <li key={area.id} data-entity-id={area.id} tabIndex={-1}>
                  {area.id}:{" "}
                  {translateGame(locale, `hotel.areaKind.${area.kind}`)},{" "}
                  {translateGame(locale, "room.floor", { value: area.floor })}
                </li>
              ))}
            </ul>
            <h3>{translateGame(locale, "hotel.navigation")}</h3>
            <ul>
              {props.floorPlan.navigationNodes.map((node) => (
                <li key={node.id} data-entity-id={node.id} tabIndex={-1}>
                  {node.id}:{" "}
                  {translateGame(locale, `hotel.navigationKind.${node.kind}`)},{" "}
                  {translateGame(locale, "room.floor", { value: node.floor })}
                  {(props.closedNavigationIds ?? []).includes(node.id)
                    ? `, ${translateGame(locale, "hotel.closed")}`
                    : ""}
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <section className="hm-card">
          <h3>{translateGame(locale, "hotel.serviceAreas")}</h3>
          <ul className="hm-card__list">
            {(props.facilities ?? []).map((facility) => (
              <li key={facility.id} data-entity-id={facility.id} tabIndex={-1}>
                <button
                  type="button"
                  aria-label={`${facility.name}, ${facility.demand} demand, ${facility.capacity} capacity, limited by ${facility.cause}`}
                  onClick={() => {
                    setSelectedFacility(facility.id);
                    props.onSelectFacility?.(facility.id);
                  }}
                >
                  {facility.name}
                </button>
              </li>
            ))}
          </ul>
          {facilityDetail ? (
            <p aria-live="polite" className="hm-card__status-msg">
              {facilityDetail.name}:{" "}
              {translateGame(locale, "panels.facilities.load", {
                demand: facilityDetail.demand,
                capacity: facilityDetail.capacity,
                share: `${facilityDetail.capacity > 0 ? Math.round((facilityDetail.demand / facilityDetail.capacity) * 100) : 0}%`,
              })}
              , {translateGame(locale, "panels.facilities.limitedBy", {
                cause: translateGame(
                  locale,
                  facilityCauseKey(facilityDetail.cause),
                ),
              })}
            </p>
          ) : null}
        </section>

        {props.situations ? (
          <section
            aria-label={translateGame(locale, "operations.title")}
            className="hm-card hm-card--operations"
          >
            <h3>{translateGame(locale, "operations.title")}</h3>
            <h4>{translateGame(locale, "operations.reception")}</h4>
            <ul>
              {props.situations.reception.desks.map((desk, index) => (
                <li key={desk.id} data-entity-id={desk.id}>
                  {translateGame(
                    locale,
                    desk.staffed
                      ? "operations.deskStaffed"
                      : "operations.deskUnstaffed",
                    {
                      number: index + 1,
                      staffId: desk.staffId
                        ? entityLabel(desk.staffId, locale)
                        : "",
                    },
                  )}
                </li>
              ))}
            </ul>
            <p>
              {translateGame(locale, "operations.receptionQueue", {
                count: props.situations.reception.queueGuestIds.length,
              })}
            </p>

            <h4>{translateGame(locale, "operations.housekeeping")}</h4>
            <ul>
              {Object.entries(
                props.situations.housekeeping.dirtyRoomIdsByFloor,
              ).map(([floor, roomIds]) => (
                <li key={floor}>
                  {translateGame(locale, "operations.dirtyRooms", {
                    floor,
                    count: roomIds.length,
                  })}
                </li>
              ))}
            </ul>
            {props.situations.housekeeping.round ? (
              <p>
                {translateGame(locale, "operations.round", {
                  agentId: entityLabel(
                    props.situations.housekeeping.round.agentId,
                    locale,
                  ),
                  targetRoomId: entityLabel(
                    props.situations.housekeeping.round.targetRoomId,
                    locale,
                  ),
                  guestLabel: props.situations.housekeeping.round.waitingGuestId
                    ? translateGame(locale, "room.guestLabel", {
                        code: guestIdentityCode(
                          props.situations.housekeeping.round.waitingGuestId,
                        ),
                      })
                    : translateGame(locale, "room.detail.none"),
                })}
              </p>
            ) : null}

            <h4>{translateGame(locale, "operations.overloads")}</h4>
            <ul>
              {props.situations.overloads.map((overload) => (
                <li key={overload.facilityId}>
                  {translateGame(locale, "operations.overload", {
                    facilityId: overload.facilityId,
                    count: overload.excess,
                    cause: facilityCauseKey(overload.cause),
                  })}
                </li>
              ))}
            </ul>

            <h4>{translateGame(locale, "operations.food")}</h4>
            <ul>
              {props.situations.fnb.outlets.map((outlet) => (
                <li key={outlet.id} data-entity-id={outlet.areaId}>
                  {translateGame(locale, "operations.outlet", {
                    outletId: entityLabel(outlet.id, locale),
                    free: outlet.tables.filter(
                      (table) => table.occupiedSeats === 0,
                    ).length,
                    waiting: outlet.queueEntityIds.length,
                    cause: facilityCauseKey(outlet.cause),
                  })}{" "}
                  {translateGame(locale, "operations.turnedAway", {
                    count: outlet.turnedAwayCount,
                  })}
                </li>
              ))}
            </ul>
            <p>
              {translateGame(locale, "operations.kitchen", {
                status: props.situations.fnb.kitchen.overloaded
                  ? "operations.kitchenOverloaded"
                  : "operations.kitchenAvailable",
                cause: facilityCauseKey(props.situations.fnb.kitchen.cause),
              })}
            </p>
          </section>
        ) : null}

        <section
          aria-label={translateGame(locale, "agent.people")}
          className="hm-card hm-card--agents"
        >
          <h3>{translateGame(locale, "agent.people")}</h3>
          <ul className="hm-card__list">
            {(props.agents ?? []).map((agent) => {
              const label =
                agent.kind === "guest"
                  ? translateGame(locale, "room.guestLabel", {
                      code: guestIdentityCode(agent.guestId ?? agent.id),
                    })
                  : agent.id;
              return (
                <li key={agent.id} data-entity-id={agent.id}>
                  <button
                    type="button"
                    aria-current={
                      props.camera?.followedAgentId === agent.id
                        ? true
                        : undefined
                    }
                    aria-label={`${translateGame(locale, "agent.follow")} ${label}`}
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      props.onSelectAgent?.(agent.id);
                    }}
                  >
                    {translateGame(locale, "agent.follow")} {label}
                  </button>
                </li>
              );
            })}
          </ul>

          {agentDetail ? (
            <section
              aria-label={translateGame(locale, "agent.detail")}
              className="hm-card__subdetail"
            >
              <h4>{translateGame(locale, "agent.detail")}</h4>
              <dl>
                <dt>{translateGame(locale, "agent.identity")}</dt>
                <dd>
                  {agentDetail.kind === "guest"
                    ? translateGame(locale, "room.guestLabel", {
                        code: guestIdentityCode(
                          agentDetail.guestId ?? agentDetail.id,
                        ),
                      })
                    : agentDetail.id}
                </dd>
                <dt>{translateGame(locale, "agent.statusLabel")}</dt>
                <dd>
                  {translateGame(
                    locale,
                    agentStatusKey(agentDetail.status ?? "working"),
                  )}
                </dd>
                <dt>{translateGame(locale, "agent.position")}</dt>
                <dd>{agentDetail.locationId}</dd>
                <dt>{translateGame(locale, "agent.route")}</dt>
                <dd>
                  {(agentDetail.routeIds ?? [agentDetail.locationId]).join(
                    " → ",
                  )}
                </dd>
              </dl>
            </section>
          ) : null}
        </section>

        {detail ? (
          <section aria-label="Room detail" className="hm-card hm-card--detail">
            <h3>{detail.id}</h3>
            <p aria-live="polite" className="hm-card__status-msg">
              {detail.id}: {humanRoomState(detail.state)}, cleanliness{" "}
              {detail.cleanliness}
            </p>
            <dl>
              <dt>{translateGame(locale, "room.detail.status")}</dt>
              <dd>{humanRoomState(detail.state)}</dd>
              <dt>{translateGame(locale, "room.detail.occupancy")}</dt>
              <dd>
                {translateGame(
                  locale,
                  occupant ? "room.detail.occupied" : "room.detail.vacant",
                )}
              </dd>
              <dt>{translateGame(locale, "room.detail.category")}</dt>
              <dd>{detail.category}</dd>
              <dt>{translateGame(locale, "room.detail.guest")}</dt>
              <dd>
                {occupant?.guestId
                  ? translateGame(locale, "room.guestLabel", {
                      code: guestIdentityCode(occupant.guestId),
                    })
                  : translateGame(locale, "room.detail.none")}
              </dd>
              <dt>{translateGame(locale, "room.detail.rate")}</dt>
              <dd>
                {rateMinor === undefined
                  ? translateGame(locale, "room.detail.notPriced")
                  : formatDm(rateMinor, locale)}
              </dd>
              {occupant ? (
                <>
                  <dt>{translateGame(locale, "room.detail.departing")}</dt>
                  <dd>{occupant.departureDateKey}</dd>
                </>
              ) : null}
              <dt>{translateGame(locale, "room.detail.condition")}</dt>
              <dd>{translateGame(locale, roomConditionKey(detail.state))}</dd>
              <dt>{translateGame(locale, "room.detail.cleanliness")}</dt>
              <dd>{detail.cleanliness}</dd>
              {roomFaultReasonByRoomId[detail.id] ? (
                <>
                  <dt>{translateGame(locale, "room.detail.faultReason")}</dt>
                  <dd>
                    {translateGame(locale, roomFaultReasonByRoomId[detail.id])}
                  </dd>
                </>
              ) : null}
              {props.renovationPhaseByRoomId?.[detail.id] ? (
                <>
                  <dt>
                    {translateGame(locale, "room.detail.renovationPhase")}
                  </dt>
                  <dd>
                    {translateGame(
                      locale,
                      renovationPhaseKey(
                        props.renovationPhaseByRoomId[detail.id],
                      ),
                    )}
                  </dd>
                </>
              ) : null}
              {detail.moduleId === undefined ? null : (
                <>
                  <dt>{translateGame(locale, "room.detail.fittedOutAs")}</dt>
                  <dd>{detail.moduleId}</dd>
                </>
              )}
              {detail.styleAgeYears === undefined ? null : (
                <>
                  <dt>
                    {translateGame(locale, "room.detail.yearsSinceRefit")}
                  </dt>
                  <dd>{detail.styleAgeYears}</dd>
                </>
              )}
            </dl>
            <h3>{translateGame(locale, "room.detail.openProblems")}</h3>
            {problems.length === 0 ? (
              <p>{translateGame(locale, "room.problems.none")}</p>
            ) : (
              <ul>
                {problems.map((problem) => (
                  <li key={problem.key}>
                    {translateGame(locale, problem.key, problem.values)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
