import i18next, { type i18n } from "i18next";
import { de } from "./resources/de";
import { en } from "./resources/en";

export type GameLocale = "de-DE" | "en-GB";
export function createGameI18n(locale: GameLocale | "de" | "en"): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    lng: locale.startsWith("de") ? "de" : "en",
    fallbackLng: "en",
    resources: { de: { translation: de }, en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  return instance;
}
