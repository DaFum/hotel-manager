with open("src/ui/TopBar.tsx", "r") as f:
    content = f.read()

content = content.replace("{formatDm(props.monthProfitMinor)}", "{formatDm(props.monthProfitMinor, locale)}")
content = content.replace("formatBasisPoints(props.occupancyBasisPoints)", "formatBasisPoints(props.occupancyBasisPoints, locale)")
content = content.replace("Save\n        </button>", '{translateGame(locale, "topbar.save" as any) || "Save"}\n        </button>')
content = content.replace("Load\n        </button>", '{translateGame(locale, "topbar.load" as any) || "Load"}\n        </button>')

with open("src/ui/TopBar.tsx", "w") as f:
    f.write(content)
