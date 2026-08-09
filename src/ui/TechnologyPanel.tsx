import type { TechnologyProject } from "../game/technology/adoption";
import type { WorldTechnologyState } from "../game/world/WorldSimulation";

export function TechnologyPanel(props: {
  technologies: readonly WorldTechnologyState[];
  projects: readonly TechnologyProject[];
  implementations: readonly string[];
  onAdopt: (technologyId: string) => void;
}) {
  return (
    <section aria-label="Technology">
      <h2>Technology</h2>
      <ul>
        {props.technologies.map((technology) => {
          const implemented = props.implementations.includes(technology.id);
          const pending = props.projects.some(
            (project) => project.technologyId === technology.id,
          );
          return (
            <li key={technology.id}>
              <span>
                {technology.id}: {technology.adoptionBp / 100}% adopted
              </span>{" "}
              <button
                type="button"
                disabled={technology.adoptionBp < 500 || implemented || pending}
                onClick={() => props.onAdopt(technology.id)}
              >
                {implemented
                  ? `Implemented ${technology.id}`
                  : pending
                    ? `Implementing ${technology.id}`
                    : `Adopt ${technology.id}`}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
