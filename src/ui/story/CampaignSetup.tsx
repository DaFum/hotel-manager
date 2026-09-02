import {
  DIFFICULTY_IDS,
  DIFFICULTY_PRESETS,
  type DifficultyId,
  type SandboxOptions,
} from "../../game/campaign/campaignConfig";
import type { GameLocale } from "../../i18n";
import { translate, translateKey } from "../localization";

/**
 * The brief the player agreed to. Every difficulty input is disclosed here
 * before the first day, because a difficulty the player cannot read is
 * indistinguishable from the game cheating.
 */
export function CampaignSetup({
  difficulty,
  sandbox,
  locked = false,
  onDifficulty,
  onSandbox,
  locale = "en-GB",
}: {
  difficulty: DifficultyId;
  sandbox?: SandboxOptions;
  /** True once the career has started; difficulty is part of the run. */
  locked?: boolean;
  onDifficulty?: (difficulty: DifficultyId) => void;
  onSandbox?: (sandbox: CampaignSandboxDraft) => void;
  locale?: GameLocale;
}) {
  const inputs = DIFFICULTY_PRESETS[difficulty];
  const numberFormat = new Intl.NumberFormat(locale);
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
          {translate("campaign.capital")}: {numberFormat.format(inputs.startingCapitalBasisPoints)}{" "}
          bp
        </li>
        <li>
          {translate("campaign.credit")}: {numberFormat.format(inputs.creditSpreadBasisPoints)} bp
        </li>
        <li>{translate("campaign.fairness")}</li>
      </ul>
      {sandbox ? (
        <fieldset>
          <legend>{translate("campaign.sandbox")}</legend>
          {(
            [
              "economicVolatilityBasisPoints",
              "crisisFrequencyBasisPoints",
              "competitorAggressionBasisPoints",
              "startingCapitalBasisPoints",
              "technologySpeedBasisPoints",
              "constructionVolatilityBasisPoints",
              "informationAccuracyBasisPoints",
            ] as const
          ).map((lever) => {
            const labelText = translateKey(`campaign.sandbox.${lever}`);
            const valueText = `${numberFormat.format(sandbox[lever] ?? 0)} bp`;
            return (
              <div key={lever} className="campaign-slider">
                <div className="campaign-slider__header">
                  <span className="campaign-slider__label">{labelText}</span>
                  <span className="campaign-slider__value">{valueText}</span>
                </div>
                <input
                  aria-label={`${labelText} ${valueText}`}
                  type="range"
                  min={lever === "technologySpeedBasisPoints" ? "1" : "0"}
                  max="20000"
                  step={lever === "technologySpeedBasisPoints" ? "1" : "500"}
                  value={sandbox[lever]}
                  disabled={locked || !onSandbox}
                  onChange={(event) =>
                    onSandbox?.({
                      ...sandbox,
                      [lever]: Number(event.currentTarget.value),
                    })
                  }
                />
              </div>
            );
          })}
        </fieldset>
      ) : null}
    </section>
  );
}

export type CampaignSandboxDraft = Partial<SandboxOptions>;
