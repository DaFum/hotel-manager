import { useEffect, useRef, useState } from "react";

export interface HotelViewRoom {
  id: string;
  category: string;
  state: string;
  cleanliness: number;
}

export function humanRoomState(state: string): string {
  return state.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

export function HotelView(props: {
  rooms: readonly HotelViewRoom[];
  onSelect?: (roomId: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let scene: {
      render: (r: readonly HotelViewRoom[]) => void;
      destroy: () => void;
    } | null = null;
    let cancelled = false;
    // The canvas is decorative: the room list below is the accessible source
    // of truth, so a headless or WebGL-less environment degrades cleanly.
    void (async () => {
      try {
        const { PixiHotelScene } = await import("../render/PixiHotelScene");
        const created = new PixiHotelScene();
        await created.attach(host.current!);
        if (cancelled) return created.destroy();
        scene = created;
        scene.render(props.rooms);
      } catch {
        /* no renderer available */
      }
    })();
    return () => {
      cancelled = true;
      scene?.destroy();
    };
  }, [props.rooms]);

  const detail = props.rooms.find((r) => r.id === selected);

  return (
    <section aria-label="Hotel view">
      <div ref={host} data-testid="hotel-canvas" />
      <ul>
        {props.rooms.map((room) => (
          <li key={room.id}>
            <button
              type="button"
              aria-label={`${room.id} ${room.category} ${humanRoomState(room.state)}`}
              onClick={() => {
                setSelected(room.id);
                props.onSelect?.(room.id);
              }}
            >
              {room.id}
            </button>
          </li>
        ))}
      </ul>
      {detail ? (
        <p aria-live="polite">
          {detail.id}: {humanRoomState(detail.state)}, cleanliness{" "}
          {detail.cleanliness}
        </p>
      ) : null}
    </section>
  );
}
