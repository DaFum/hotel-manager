import { entityLabel } from "./entityNames";
import { translateGame, type GameLocale } from "../i18n";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  detailFor,
  focusCamera,
  lightingFor,
  panCamera,
  selectFloor,
  toggleServiceAreas,
  visibleFloor,
  zoomCamera,
  type CameraState,
  type FocusTarget,
} from "../render/camera";

export interface WorldProblem {
  id: string;
  entityId: string;
  title: string;
  cause: string;
  causeValues?: Record<string, string | number>;
  floor: number;
  x: number;
  y: number;
  kind: FocusTarget["kind"];
}

/**
 * Design intent (AGENTS §13)
 * - Purpose: give every isometric action a keyboard and a screen-reader path,
 *   so the world is navigable without a mouse or a canvas.
 * - Tone: a building control panel — floors as a list, the view stated in
 *   words, problems as a queue of places to go.
 * - Constraints: no colour-only state; the current floor, the light and the
 *   level of detail are all written out; every control is a real button.
 * - Differentiator: focusing a problem moves the same camera the canvas uses,
 *   so the list and the world are two views of one state rather than two
 *   parallel interfaces.
 */
export function WorldControls(props: {
  camera: CameraState;
  floors: readonly number[];
  minuteOfDay: number;
  problems: readonly WorldProblem[];
  elevator: {
    queue: number;
    waitMinutes: number;
    cause: string;
    cars?: readonly {
      id: string;
      currentFloor: number;
      targetFloor: number;
      direction: "up" | "down" | "idle";
      failed: boolean;
      waitingGuestIds: readonly string[];
    }[];
  };
  onCamera: (camera: CameraState) => void;
  locale?: GameLocale;
}) {
  const { camera } = props;
  const light = lightingFor(props.minuteOfDay);
  const detail = detailFor(camera.zoom);
  const locale = props.locale ?? "en-GB";
  const elevatorCauseKey: string | undefined = (
    {
      "out of service": "world.elevatorCause.unavailable",
      "queue exceeds car capacity": "world.elevatorCause.overloaded",
      available: "world.elevatorCause.available",
      "world.elevatorCause.notSimulated": "world.elevatorCause.notSimulated",
    } as Readonly<Record<string, string>>
  )[props.elevator.cause];
  const elevatorCause = elevatorCauseKey
    ? translateGame(locale, elevatorCauseKey)
    : props.elevator.cause;

  return (
    <section aria-label="World controls" className="world-controls">
      <h2>World</h2>
      <p
        role="status"
        aria-label="View state"
        className="world-controls__status"
      >
        Floor {camera.floor}, {camera.cutaway ? "cut away" : "whole building"},{" "}
        zoom {camera.zoom.toFixed(1)} showing {detail}, {light} light
      </p>

      <div className="world-controls__group">
        <h3>Move</h3>
        <div className="world-controls__actions">
          <button
            type="button"
            aria-label="Pan left"
            onClick={() => props.onCamera(panCamera(camera, { x: -64, y: 0 }))}
          >
            Pan left
          </button>
          <button
            type="button"
            aria-label="Pan right"
            onClick={() => props.onCamera(panCamera(camera, { x: 64, y: 0 }))}
          >
            Pan right
          </button>
          <div className="world-controls__zoom">
            <button
              className="world-controls__zoom-in"
              type="button"
              aria-label="Zoom in"
              disabled={camera.zoom >= MAX_ZOOM}
              onClick={() =>
                props.onCamera(zoomCamera(camera, camera.zoom + 0.5))
              }
            >
              Zoom in
            </button>
            <button
              className="world-controls__zoom-out"
              type="button"
              aria-label="Zoom out"
              disabled={camera.zoom <= MIN_ZOOM}
              onClick={() =>
                props.onCamera(zoomCamera(camera, camera.zoom - 0.5))
              }
            >
              Zoom out
            </button>
          </div>
        </div>
      </div>

      <div className="world-controls__group">
        <h3>Floors</h3>
        <ul className="world-controls__floors-list">
          {props.floors.map((floor) => (
            <li key={floor}>
              <button
                type="button"
                aria-label={`Show floor ${floor}`}
                aria-pressed={camera.floor === floor}
                onClick={() =>
                  props.onCamera(selectFloor(camera, floor, camera.cutaway))
                }
              >
                Floor {floor}
                {visibleFloor(floor, camera) ? " (visible)" : " (hidden)"}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-label="Toggle cutaway"
          aria-pressed={camera.cutaway}
          onClick={() =>
            props.onCamera(selectFloor(camera, camera.floor, !camera.cutaway))
          }
        >
          {camera.cutaway ? "Show whole building" : "Cut away above this floor"}
        </button>
      </div>

      <div className="world-controls__group">
        <h3>{translateGame(locale, "world.layers")}</h3>
        <button
          type="button"
          aria-label={translateGame(
            locale,
            camera.showServiceAreas
              ? "world.hideServiceAreas"
              : "world.showServiceAreas",
          )}
          aria-pressed={camera.showServiceAreas}
          onClick={() => props.onCamera(toggleServiceAreas(camera))}
        >
          {translateGame(
            locale,
            camera.showServiceAreas
              ? "world.hideServiceAreas"
              : "world.showServiceAreas",
          )}
        </button>
      </div>

      <div className="world-controls__group">
        <h3>{translateGame(locale, "world.lifts")}</h3>
        <p
          role="status"
          aria-label={translateGame(locale, "world.elevatorState")}
          className="world-controls__substatus"
        >
          {translateGame(locale, "world.elevatorSummary", {
            queue: props.elevator.queue,
            minutes: props.elevator.waitMinutes,
            cause: elevatorCause,
          })}
        </p>
        {(props.elevator.cars?.length ?? 0) > 0 ? (
          <ul className="world-controls__lifts-list">
            {props.elevator.cars?.map((car) => (
              <li key={car.id} data-entity-id={car.id}>
                {translateGame(locale, "world.liftCar", {
                  id: entityLabel(car.id, locale),
                  floor: car.currentFloor,
                  direction: `world.direction.${car.direction}`,
                  status: car.failed
                    ? "world.carStatus.failed"
                    : "world.carStatus.ready",
                  waiting: car.waitingGuestIds.length,
                })}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="world-controls__group">
        <h3>Problems</h3>
        {props.problems.length === 0 ? (
          <p className="world-controls__empty">Nothing needs attention.</p>
        ) : (
          <ul className="world-controls__problems-list">
            {props.problems.map((problem) => (
              <li key={problem.id}>
                <button
                  type="button"
                  aria-label={translateGame(locale, "world.goToProblem", {
                    title: translateGame(
                      locale,
                      problem.title,
                      problem.causeValues,
                    ),
                    cause: translateGame(
                      locale,
                      problem.cause,
                      problem.causeValues,
                    ),
                  })}
                  aria-current={
                    camera.focusedId === problem.entityId ? true : undefined
                  }
                  onClick={() =>
                    props.onCamera(
                      focusCamera(camera, {
                        id: problem.entityId,
                        x: problem.x,
                        y: problem.y,
                        floor: problem.floor,
                        kind: problem.kind,
                      }),
                    )
                  }
                >
                  {translateGame(locale, problem.title, problem.causeValues)} —{" "}
                  {translateGame(locale, problem.cause, problem.causeValues)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
