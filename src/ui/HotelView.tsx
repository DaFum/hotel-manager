import { useEffect, useRef, useState } from "react";
import { SemanticHotelTree } from "./accessibility/SemanticHotelTree";
import { roomConcern } from "../render/sceneLayout";
import { formatDm } from "./money";
import type { CameraState } from "../render/camera";
import type { VisualAgent } from "../render/agentMaterialization";
import type { GameLocale } from "../i18n";

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
  renovatingRoomIds: readonly string[] = [],
): string[] {
  const problems: string[] = [];
  if (roomConcern(room.state, room.cleanliness) === "out-of-service")
    problems.push(`Out of service: ${humanRoomState(room.state)}`);
  if (roomConcern(room.state, room.cleanliness) === "needs-cleaning")
    problems.push(`Needs housekeeping: cleanliness ${room.cleanliness}`);
  if (renovatingRoomIds.includes(room.id)) problems.push("Shut for renovation");
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
  /** Rooms currently shut for a renovation the house is paying for. */
  renovatingRoomIds?: readonly string[];
  onSelect?: (roomId: string) => void;
  onSelectFacility?: (facilityId: string) => void;
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
  selectRoom.current = (roomId: string) => props.onSelect?.(roomId);

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
      camera: props.camera,
      selectedId: selected,
      minuteOfDay: props.minuteOfDay ?? 720,
    });
  }, [
    props.rooms,
    props.facilities,
    props.agents,
    props.floorByRoomId,
    props.camera,
    props.minuteOfDay,
    selected,
    sceneReady,
  ]);

  const detail = props.rooms.find((r) => r.id === selected);
  const facilityDetail = (props.facilities ?? []).find(
    (facility) => facility.id === selectedFacility,
  );
  const stay = detail
    ? (props.stays ?? []).find((s) => s.roomId === detail.id)
    : undefined;
  const rateMinor = detail
    ? (stay?.rateMinor ?? props.rateByCategory?.[detail.category])
    : undefined;
  const problems = detail ? roomProblems(detail, props.renovatingRoomIds) : [];

  return (
    <section aria-label="Hotel view">
      <div className="hm-canvas" ref={host} data-testid="hotel-canvas" />
      <SemanticHotelTree
        locale={props.locale}
        rooms={props.rooms}
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
            <dt>Status</dt>
            <dd>{humanRoomState(detail.state)}</dd>
            <dt>Category</dt>
            <dd>{detail.category}</dd>
            <dt>Guest</dt>
            <dd>{stay ? stay.bookingId : "none"}</dd>
            <dt>Rate</dt>
            <dd>
              {rateMinor === undefined ? "not priced" : formatDm(rateMinor)}
            </dd>
            {stay ? (
              <>
                <dt>Departing</dt>
                <dd>{stay.departureDateKey}</dd>
              </>
            ) : null}
            <dt>Condition</dt>
            <dd>{detail.cleanliness}</dd>
            {detail.moduleId === undefined ? null : (
              <>
                <dt>Fitted out as</dt>
                <dd>{detail.moduleId}</dd>
              </>
            )}
            {detail.styleAgeYears === undefined ? null : (
              <>
                <dt>Years since refit</dt>
                <dd>{detail.styleAgeYears}</dd>
              </>
            )}
          </dl>
          <h3>Open problems</h3>
          {problems.length === 0 ? (
            <p>Nothing outstanding in this room.</p>
          ) : (
            <ul>
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  );
}
