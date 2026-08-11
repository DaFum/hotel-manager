import { translateAlertCause } from "./localization";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  detailFor,
  focusCamera,
  lightingFor,
  panCamera,
  selectFloor,
  visibleFloor,
  zoomCamera,
  type CameraState,
  type FocusTarget,
} from "../render/camera";

export interface WorldProblem {
  id: string;
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
  elevator: { queue: number; waitMinutes: number; cause: string };
  onCamera: (camera: CameraState) => void;
}) {
  const { camera } = props;
  const light = lightingFor(props.minuteOfDay);
  const detail = detailFor(camera.zoom);

  return (
    <section aria-label="World controls">
      <h2>World</h2>
      <p role="status" aria-label="View state">
        Floor {camera.floor}, {camera.cutaway ? "cut away" : "whole building"},{" "}
        zoom {camera.zoom.toFixed(1)} showing {detail}, {light} light
      </p>

      <h3>Move</h3>
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
          onClick={() => props.onCamera(zoomCamera(camera, camera.zoom + 0.5))}
        >
          Zoom in
        </button>
        <button
          className="world-controls__zoom-out"
          type="button"
          aria-label="Zoom out"
          disabled={camera.zoom <= MIN_ZOOM}
          onClick={() => props.onCamera(zoomCamera(camera, camera.zoom - 0.5))}
        >
          Zoom out
        </button>
      </div>

      <h3>Floors</h3>
      <ul>
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

      <h3>Lifts</h3>
      <p role="status" aria-label="Elevator state">
        {props.elevator.queue} waiting, {props.elevator.waitMinutes} minutes,{" "}
        {props.elevator.cause}
      </p>

      <h3>Problems</h3>
      {props.problems.length === 0 ? (
        <p>Nothing needs attention.</p>
      ) : (
        <ul>
          {props.problems.map((problem) => (
            <li key={problem.id}>
              <button
                type="button"
                aria-label={`Go to ${problem.title}: ${translateAlertCause(problem.cause, problem.causeValues)}`}
                // Where the camera is, not a toggle the player switched on.
                aria-current={
                  camera.focusedId === problem.id ? true : undefined
                }
                onClick={() =>
                  props.onCamera(
                    focusCamera(camera, {
                      id: problem.id,
                      x: problem.x,
                      y: problem.y,
                      floor: problem.floor,
                      kind: problem.kind,
                    }),
                  )
                }
              >
                {problem.title} — {translateAlertCause(problem.cause, problem.causeValues)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
