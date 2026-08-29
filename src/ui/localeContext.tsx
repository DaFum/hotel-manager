import { createContext, useContext, type ReactNode } from "react";
import { translateGame, type GameLocale } from "../i18n";

/**
 * The locale, available to any panel without threading a prop through every
 * call site.
 *
 * Most panels take a `locale` prop and most of them should keep it: it is
 * explicit, and it lets a test render a panel in one language without a
 * provider. But a dozen dashboards were written with their text hardcoded in
 * English and no `locale` prop at all, and a German player was reading
 * "Commercial spaces", "Limited by:" and "Expand conference space" in the
 * middle of an otherwise German interface. Threading a prop through all of
 * them, and through the intermediate components that only forward it, buys
 * nothing over reading it from the frame they already render inside.
 *
 * The default is `en-GB`, so a panel rendered outside a provider — in a unit
 * test, say — behaves exactly as it did when its text was hardcoded English.
 */
const LocaleContext = createContext<GameLocale>("en-GB");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: GameLocale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): GameLocale {
  return useContext(LocaleContext);
}

/**
 * The translator, bound to the surrounding locale. A panel that already takes
 * an explicit `locale` prop should keep passing it via `translateGame`; this
 * is for the panels that never had one.
 */
export function useT(): (
  key: string,
  values?: Record<string, string | number>,
) => string {
  const locale = useLocale();
  return (key, values = {}) => translateGame(locale, key, values);
}
