# 1. Update theme layout.css
with open("src/ui/theme/layout.css", "r") as f:
    content = f.read()

content = content.replace("align-items: start;\n  min-height: 100vh;", "align-items: start;\n  min-height: 100vh;\n  height: 100vh;")
content = content.replace(
    "padding: var(--hm-space-7) 0 var(--hm-space-6);\n  border-right: 1px solid var(--hm-rule);",
    "padding: var(--hm-space-7) 0 var(--hm-space-6);\n  border-right: 1px solid var(--hm-rule);\n  height: 100vh;\n  overflow-y: auto;"
)
content = content.replace("box-shadow: 1px 0 0 rgb(0 0 0 / 40%);", "box-shadow: 1px 0 0 var(--hm-shadow-rail);")

with open("src/ui/theme/layout.css", "w") as f:
    f.write(content)

# 2. Update theme motion.css
with open("src/ui/theme/motion.css", "r") as f:
    content = f.read()

content = content.replace(
    """[data-reduced-motion="true"] *,
[data-reduced-motion="true"] *::before,
[data-reduced-motion="true"] *::after {
  animation-delay: 0ms !important;
}""",
    """[data-reduced-motion="true"] *,
[data-reduced-motion="true"] *::before,
[data-reduced-motion="true"] *::after {
  animation-delay: 0ms !important;
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
}"""
)

with open("src/ui/theme/motion.css", "w") as f:
    f.write(content)

# 3. Update theme tokens.css
with open("src/ui/theme/tokens.css", "r") as f:
    content = f.read()

content = content.replace(
    "--hm-steel-wash: rgb(109 157 197 / 12%);",
    "--hm-steel-wash: rgb(109 157 197 / 12%);\n\n  /* --- Atmospheric accents --------------------------------------------- */\n  --hm-atmosphere: rgb(109 157 197 / 10%);\n  --hm-atmosphere-wash: rgb(232 163 61 / 7%);"
)
content = content.replace(
    "--hm-ground-deep: #070809;",
    "--hm-ground-deep: #070809;\n  --hm-hover-bg: rgb(255 255 255 / 2%);"
)
content = content.replace(
    "--hm-shadow-signal: 0 0 0 1px var(--hm-signal-deep);",
    "--hm-shadow-signal: 0 0 0 1px var(--hm-signal-deep);\n  --hm-shadow-rail: rgb(0 0 0 / 40%);"
)
content = content.replace(
    "--hm-z-grain: 60;",
    "--hm-z-grain: 60;\n  --hm-backdrop: rgb(4 5 6 / 72%);"
)

with open("src/ui/theme/tokens.css", "w") as f:
    f.write(content)

# 4. Update other css files
with open("src/ui/theme/base.css", "r") as f:
    content = f.read()
content = content.replace("rgb(232 163 61 / 7%)", "var(--hm-atmosphere-wash)")
content = content.replace("rgb(109 157 197 / 6%)", "var(--hm-steel-wash)")
with open("src/ui/theme/base.css", "w") as f:
    f.write(content)

with open("src/ui/theme/panels.css", "r") as f:
    content = f.read()
content = content.replace("background: rgb(255 255 255 / 2%);", "background: var(--hm-hover-bg);")
content = content.replace("rgb(109 157 197 / 10%)", "var(--hm-atmosphere)")
with open("src/ui/theme/panels.css", "w") as f:
    f.write(content)

with open("src/ui/theme/overlays.css", "r") as f:
    content = f.read()
content = content.replace("background: rgb(4 5 6 / 72%);", "background: var(--hm-backdrop);")
with open("src/ui/theme/overlays.css", "w") as f:
    f.write(content)

# 5. Update TopBar.tsx
with open("src/ui/TopBar.tsx", "r") as f:
    content = f.read()
content = content.replace("{formatDm(props.monthProfitMinor)}", "{formatDm(props.monthProfitMinor, locale)}")
content = content.replace("formatBasisPoints(props.occupancyBasisPoints)", "formatBasisPoints(props.occupancyBasisPoints, locale)")
content = content.replace("Save", '{translateGame(locale, "topbar.save" as any) || "Save"}')
content = content.replace("Load", '{translateGame(locale, "topbar.load" as any) || "Load"}')
with open("src/ui/TopBar.tsx", "w") as f:
    f.write(content)

# 6. Update App.tsx telemetry
with open("src/app/App.tsx", "r") as f:
    content = f.read()
content = content.replace("Command: {game.commandStatus}", '{translateGame(preferences.locale, "app.telemetry.command" as any, { status: game.commandStatus })}')
content = content.replace("Saves committed: {game.savedCount}", '{translateGame(preferences.locale, "app.telemetry.saves" as any, { count: game.savedCount })}')
with open("src/app/App.tsx", "w") as f:
    f.write(content)
