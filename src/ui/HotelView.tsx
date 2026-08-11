import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SemanticHotelTree } from "./accessibility/SemanticHotelTree";
import { roomConcern } from "../render/sceneLayout";
import { formatDm } from "./money";
import { dragCamera, wheelZoom, type CameraState } from "../render/camera";
import type { VisualAgent } from "../render/agentMaterialization";
import { translateGame, type GameLocale } from "../i18n";
import type { RoomOccupantRef } from "../game/simulation/initialState";
import type { Phase as RenovationPhase } from "../game/renovation/projects";
import {
  guestIdentityCode,
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
  renovationPhaseByRoomId: Readonly<Record<string, RenovationPhase>>;
  camera?: CameraState;
  selectedId: string | null;
  minuteOfDay: number;
}

interface PixiScene {
  render: (model: SceneModel) => void;
  onRoomSelected: (handler: (roomId: string) => void) => void;
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

/**
 * Design intent (AGENTS §13)
 * - Purpose: let the player see the house as it actually stands right now, and
 *   get from a thing that is wrong to the room it is wrong in.
 * - Tone: a building under a desk lamp — the same materials as the management
 *   panels around it, never a game window dropped into an admin page.
 * - Constraints: the canvas is decorative in the accessibility sense; every
 *   room and facility it draws is also a real DOM control, and the view
 *   degrades to its register when no renderer exists.
 * - Differentiator: one selection. Clicking a room in the world and choosing
 *   it in the register are the same act, and both open the same operational
 *   detail — the world and the management surface never disagree.
 */
export function HotelView(props: {
  rooms: readonly HotelViewRoom[];
  facilities?: readonly HotelViewFacility[];
  agents?: readonly VisualAgent[];
  floorByRoomId?: Readonly<Record<string, number>>;
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
  /** Moving the view; the world controls move the very same camera. */
  onCamera?: (camera: CameraState) => void;
  /** Entity the camera just reached; rooms receive equivalent DOM focus. */
  focusedEntityId?: string | null;
  disableRenderer?: boolean;
  locale?: GameLocale;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const scene = useRef<PixiScene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  // The scene is attached once and keeps the handler it was given, so the
  // callback is held in a ref rather than baked into that one attachment.
  const selectRoom = useRef<(roomId: string) => void>(() => {});

  // Attach once. The worker republishes a snapshot ten times a second, so
  // rebuilding the WebGL context per update would thrash the renderer.
  useEffect(() => {
    if (props.disableRenderer) return;
    let cancelled = false;
    // The canvas is decorative: the room list below is the accessible source
    // of truth, so a headless or WebGL-less environment degrades cleanly.
    void (async () => {
      try {
        const { PixiHotelScene } = await import("../render/PixiHotelScene");
        const created = new PixiHotelScene();
        await created.attach(host.current!);
        if (cancelled) return created.destroy();
        // Clicking a room in the world is the same act as choosing it in the
        // register, so it lands in the same state and opens the same detail.
        created.onRoomSelected((roomId) => {
          setSelected(roomId);
          selectRoom.current(roomId);
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
    props.renovationPhaseByRoomId,
    props.camera,
    props.minuteOfDay,
    selected,
    sceneReady,
  ]);

  // Pan by dragging and zoom by wheel, on the same camera the floor buttons
  // move. The buttons stay the accessible path; this is the direct one.
  const drag = useRef<{ x: number; y: number } | null>(null);
  const cameraRef = useRef(props.camera);

  const moveCamera = useRef<(camera: CameraState) => void>(() => {});
  useLayoutEffect(() => {
    selectRoom.current = (roomId: string) => props.onSelect?.(roomId);
    cameraRef.current = props.camera;
    moveCamera.current = (camera: CameraState) => props.onCamera?.(camera);
  });

  useEffect(() => {
    const node = host.current;
    if (!node || !props.onCamera) return;
    // Non-passive, because a wheel over the building must zoom the house
    // rather than scroll the page out from under it.
    const onWheel = (event: WheelEvent) => {
      const camera = cameraRef.current;
      if (!camera) return;
      event.preventDefault();
      moveCamera.current(wheelZoom(camera, event.deltaY));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [props.onCamera]);

  const detail = props.rooms.find((r) => r.id === selected);
  const facilityDetail = (props.facilities ?? []).find(
    (facility) => facility.id === selectedFacility,
  );
  const stay = detail
    ? (props.stays ?? []).find((s) => s.roomId === detail.id)
    : undefined;
  const occupant = detail
    ? (props.occupantByRoomId?.[detail.id] ??
      (stay
        ? {
            guestId: `guest.${stay.bookingId}`,
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
    };
  });

  return (
    <section aria-label="Hotel view">
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
          // Apply a small drag threshold to differentiate between a click and a pan.
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
      <h3>Service areas</h3>
      <ul>
        {(props.facilities ?? []).map((facility) => (
          <li key={facility.id}>
            <button
              type="button"
              aria-label={`${facility.name}, ${facility.demand} demand, ${facility.capacity} capacity, limited by ${facility.cause}`}
              onClick={() => {
                setSelectedFacility(facility.id);
                props.onSelectFacility?.(facility.id);
              }}
            >
              Focus {facility.name}
            </button>
          </li>
        ))}
      </ul>
      {facilityDetail ? (
        <p aria-live="polite">
          {facilityDetail.name}: {facilityDetail.demand} demand,{" "}
          {facilityDetail.capacity} capacity, limited by {facilityDetail.cause}
        </p>
      ) : null}
      {detail ? (
        <section aria-label="Room detail">
          <h3>{detail.id}</h3>
          {/* The one-line reading stays exactly as it was: it is the live
              region a screen reader hears the moment a room is chosen. */}
          <p aria-live="polite">
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
              {occupant
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
            {props.renovationPhaseByRoomId?.[detail.id] ? (
              <>
                <dt>{translateGame(locale, "room.detail.renovationPhase")}</dt>
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
                <dt>{translateGame(locale, "room.detail.yearsSinceRefit")}</dt>
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
    </section>
  );
}
