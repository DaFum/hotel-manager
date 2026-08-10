import { useEffect, useRef, useState } from "react";
import { SemanticHotelTree } from "./accessibility/SemanticHotelTree";
import type { GameLocale } from "../i18n";

export interface HotelViewRoom {
  id: string;
  category: string;
  state: string;
  cleanliness: number;
}

export interface HotelViewFacility {
  id: string;
  name: string;
  demand: number;
  capacity: number;
  cause: string;
}

interface PixiScene {
  render: (
    rooms: readonly HotelViewRoom[],
    facilities: readonly HotelViewFacility[],
  ) => void;
  destroy: () => void;
}

export function humanRoomState(state: string): string {
  return state.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

export function HotelView(props: {
  rooms: readonly HotelViewRoom[];
  facilities?: readonly HotelViewFacility[];
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
    if (sceneReady) scene.current?.render(props.rooms, props.facilities ?? []);
  }, [props.rooms, props.facilities, sceneReady]);

  const detail = props.rooms.find((r) => r.id === selected);
  const facilityDetail = (props.facilities ?? []).find(
    (facility) => facility.id === selectedFacility,
  );

  return (
    <section aria-label="Hotel view">
      <div ref={host} data-testid="hotel-canvas" />
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
        <p aria-live="polite">
          {detail.id}: {humanRoomState(detail.state)}, cleanliness{" "}
          {detail.cleanliness}
        </p>
      ) : null}
    </section>
  );
}
