with open("src/ui/money.ts", "r") as f:
    content = f.read()

content = content.replace("export function formatDm(minor: number): string {", "import type { GameLocale } from \"../i18n\";\nimport { formatMinorCurrency } from \"../i18n/formatters\";\n\n/** Pfennig are the only stored unit; formatting happens at the very edge. */\nexport function formatDm(minor: number, locale: GameLocale = \"de-DE\"): string {\n  if (locale !== \"de-DE\") return formatMinorCurrency(minor, \"DEM\", locale);")
content = content.replace("export function formatBasisPoints(bp: number): string {", "export function formatBasisPoints(bp: number, locale: GameLocale = \"de-DE\"): string {\n  if (locale !== \"de-DE\") return new Intl.NumberFormat(locale, { style: \"percent\", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bp / 10000);")

with open("src/ui/money.ts", "w") as f:
    f.write(content)
