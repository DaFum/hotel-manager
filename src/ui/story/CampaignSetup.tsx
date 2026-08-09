import {
  DIFFICULTY_IDS,
  DIFFICULTY_PRESETS,
  type DifficultyId,
  type SandboxOptions,
} from "../../game/campaign/campaignConfig";
import { translate, translateKey } from "../localization";

/**
 * The brief the player agreed to. Every difficulty input is disclosed here
 * before the first day, because a difficulty the player cannot read is
 * indistinguishable from the game cheating.
 */
export function CampaignSetup({
  difficulty,
  locked = false,
  onDifficulty,
}: {
  difficulty: DifficultyId;
  /** True once the career has started; difficulty is part of the run. */
  locked?: boolean;
  onDifficulty?: (difficulty: DifficultyId) => void;
}) {
  const inputs = DIFFICULTY_PRESETS[difficulty];
  return (
    <section aria-label={translate("campaign.setup")}>
      <h2>{translate("campaign.title")}</h2>
      <label>
        {translate("campaign.difficulty")}{" "}
        <select
          value={difficulty}
          onChange={(event) =>
            onDifficulty?.(event.target.value as DifficultyId)
          }
          disabled={locked || !onDifficulty}
        >
          {DIFFICULTY_IDS.map((id) => (
            <option key={id} value={id}>
              {translateKey(`campaign.difficulty.${id}`)}
            </option>
          ))}
        </select>
      </label>
      <ul>
        <li>
          {translate("campaign.capital")}: {inputs.startingCapitalBasisPoints}{" "}
          bp
        </li>
        <li>
          {translate("campaign.credit")}: {inputs.creditSpreadBasisPoints} bp
        </li>
        <li>{translate("campaign.fairness")}</li>
      </ul>
    </section>
  );
}

export type CampaignSandboxDraft = Partial<SandboxOptions>;
