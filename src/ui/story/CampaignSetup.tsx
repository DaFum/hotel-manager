import {
  DIFFICULTY_IDS,
  DIFFICULTY_PRESETS,
  type DifficultyId,
  type SandboxOptions,
} from "../../game/campaign/campaignConfig";
import { translateGame, type GameLocale } from "../../i18n";

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
  const t = (k: string) => translateGame(locale, k);
  const inputs = DIFFICULTY_PRESETS[difficulty];
  const numberFormat = new Intl.NumberFormat(locale);
  return (
    <section aria-label={t("campaignSetup.setup")}>
      <h2>{t("campaignSetup.title")}</h2>
      <label>
        {t("campaignSetup.difficulty")}{" "}
        <select
          value={difficulty}
          onChange={(event) =>
            onDifficulty?.(event.target.value as DifficultyId)
          }
          disabled={locked || !onDifficulty}
        >
          {DIFFICULTY_IDS.map((id) => (
            <option key={id} value={id}>
              {t(`campaignSetup.difficultyOption.${id}`)}
            </option>
          ))}
        </select>
      </label>
      <ul>
        <li>
          {t("campaignSetup.capital")}:{" "}
          {numberFormat.format(inputs.startingCapitalBasisPoints)} bp
        </li>
        <li>
          {t("campaignSetup.credit")}:{" "}
          {numberFormat.format(inputs.creditSpreadBasisPoints)} bp
        </li>
        <li>{t("campaignSetup.fairness")}</li>
      </ul>
      {sandbox ? (
        <fieldset>
          <legend>{t("campaignSetup.sandbox")}</legend>
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
            const labelText = t(`campaignSetup.sandboxLever.${lever}`);
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
