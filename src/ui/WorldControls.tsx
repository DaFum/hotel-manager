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
    <section
      aria-label={translateGame(locale, "world.region")}
      className="world-controls"
    >
      <h2>{translateGame(locale, "world.title")}</h2>
      <p
        role="status"
        aria-label={translateGame(locale, "world.viewStateLabel")}
        className="world-controls__status"
      >
        {translateGame(locale, "world.viewState", {
          floor: camera.floor,
          cutaway: translateGame(
            locale,
            camera.cutaway ? "world.cutaway.on" : "world.cutaway.off",
          ),
          zoom: camera.zoom.toFixed(1),
          detail: translateGame(locale, `world.detail.${detail}`),
          light: translateGame(locale, `world.light.${light}`),
        })}
      </p>

      <div className="world-controls__group">
        <h3>{translateGame(locale, "world.move")}</h3>
        <div className="world-controls__actions">
          <button
            type="button"
            aria-label={translateGame(locale, "world.panLeft")}
            onClick={() => props.onCamera(panCamera(camera, { x: -64, y: 0 }))}
          >
            {translateGame(locale, "world.panLeft")}
          </button>
          <button
            type="button"
            aria-label={translateGame(locale, "world.panRight")}
            onClick={() => props.onCamera(panCamera(camera, { x: 64, y: 0 }))}
          >
            {translateGame(locale, "world.panRight")}
          </button>
          <div className="world-controls__zoom">
            <button
              className="world-controls__zoom-in"
              type="button"
              aria-label={translateGame(locale, "world.zoomIn")}
              disabled={camera.zoom >= MAX_ZOOM}
              onClick={() =>
                props.onCamera(zoomCamera(camera, camera.zoom + 0.5))
              }
            >
              {translateGame(locale, "world.zoomIn")}
            </button>
            <button
              className="world-controls__zoom-out"
              type="button"
              aria-label={translateGame(locale, "world.zoomOut")}
              disabled={camera.zoom <= MIN_ZOOM}
              onClick={() =>
                props.onCamera(zoomCamera(camera, camera.zoom - 0.5))
              }
            >
              {translateGame(locale, "world.zoomOut")}
            </button>
          </div>
        </div>
      </div>

      <div className="world-controls__group">
        <h3>{translateGame(locale, "world.floors")}</h3>
        <ul className="world-controls__floors-list">
          {props.floors.map((floor) => (
            <li key={floor}>
              <button
                type="button"
                aria-label={translateGame(locale, "world.showFloor", {
                  floor,
                })}
                aria-pressed={camera.floor === floor}
                onClick={() =>
                  props.onCamera(selectFloor(camera, floor, camera.cutaway))
                }
              >
                {translateGame(locale, "world.floorLabel", {
                  floor,
                  visibility: translateGame(
                    locale,
                    visibleFloor(floor, camera)
                      ? "world.visible"
                      : "world.hidden",
                  ),
                })}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-label={translateGame(locale, "world.toggleCutaway")}
          aria-pressed={camera.cutaway}
          onClick={() =>
            props.onCamera(selectFloor(camera, camera.floor, !camera.cutaway))
          }
        >
          {translateGame(
            locale,
            camera.cutaway ? "world.showWholeBuilding" : "world.cutAwayAbove",
          )}
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
        <h3>{translateGame(locale, "world.problems")}</h3>
        {props.problems.length === 0 ? (
          <p className="world-controls__empty">
            {translateGame(locale, "world.noProblems")}
          </p>
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
