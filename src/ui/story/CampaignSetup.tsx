import {
  DIFFICULTY_PRESETS,
  type DifficultyId,
  type SandboxOptions,
} from "../../game/campaign/campaignConfig";
export function CampaignSetup({
  difficulty,
  onDifficulty,
}: {
  difficulty: DifficultyId;
  onDifficulty?: (difficulty: DifficultyId) => void;
}) {
  return (
    <section aria-label="Campaign setup">
      <h2>Campaign brief — Frankfurt, 1 January 1991</h2>
      <label>
        Difficulty{" "}
        <select
          value={difficulty}
          onChange={(event) =>
            onDifficulty?.(event.target.value as DifficultyId)
          }
          disabled={!onDifficulty}
        >
          {(Object.keys(DIFFICULTY_PRESETS) as DifficultyId[]).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <ul>
        <li>
          Capital: {DIFFICULTY_PRESETS[difficulty].startingCapitalBasisPoints}{" "}
          bp
        </li>
        <li>
          Credit: {DIFFICULTY_PRESETS[difficulty].creditSpreadBasisPoints} bp
        </li>
        <li>Competition: No hidden money or knowledge</li>
      </ul>
    </section>
  );
}
export type CampaignSandboxDraft = Partial<SandboxOptions>;
