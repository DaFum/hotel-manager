import type { TechnologyProject } from "../game/technology/adoption";
import type { WorldTechnologyState } from "../game/world/WorldSimulation";
import { entityLabel } from "./entityNames";
import { useLocale } from "./localeContext";
import { translateGame } from "../i18n";

export function TechnologyPanel(props: {
  technologies: readonly WorldTechnologyState[];
  projects: readonly TechnologyProject[];
  implementations: readonly string[];
  onAdopt: (technologyId: string) => void;
}) {
  const locale = useLocale();
  return (
    <section aria-label="Technology">
      <h2>{translateGame(locale, "panels.technology.title")}</h2>
      <ul>
        {props.technologies.map((technology) => {
          const implemented = props.implementations.includes(technology.id);
          const pending = props.projects.some(
            (project) => project.technologyId === technology.id,
          );
          // "Adopt personal-computer" named the record, not the machine.
          const name = entityLabel(technology.id, locale);
          return (
            <li key={technology.id}>
              <span>
                {translateGame(locale, "panels.technology.adopted", {
                  name,
                  share: technology.adoptionBp / 100,
                })}
              </span>{" "}
              <button
                type="button"
                disabled={technology.adoptionBp < 500 || implemented || pending}
                onClick={() => props.onAdopt(technology.id)}
              >
                {translateGame(
                  locale,
                  implemented
                    ? "panels.technology.implemented"
                    : pending
                      ? "panels.technology.implementing"
                      : "panels.technology.adopt",
                  { name },
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
