import i18next, { type i18n } from "i18next";
import { de } from "./resources/de";
import { en } from "./resources/en";

export type GameLocale = "de-DE" | "en-GB";
export async function createGameI18n(
  locale: GameLocale | "de" | "en",
): Promise<i18n> {
  const instance = i18next.createInstance();
  await instance.init({
    lng: locale.startsWith("de") ? "de" : "en",
    fallbackLng: "en",
    resources: { de: { translation: de }, en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  return instance;
}

interface TranslationBranch {
  [key: string]: string | TranslationBranch;
}
export function translateGame(
  locale: GameLocale,
  key: string,
  values: Record<string, string | number> = {},
): string {
  const catalogue = (locale === "de-DE" ? de : en) as TranslationBranch;
  const found = key
    .split(".")
    .reduce<string | TranslationBranch | undefined>(
      (value, part) =>
        value && typeof value === "object" ? value[part] : undefined,
      catalogue,
    );
  if (typeof found !== "string") return key;
  return found.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? `{${name}}`),
  );
}
